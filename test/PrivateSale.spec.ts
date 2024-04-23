import {loadFixture, time,} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {SignerWithAddress} from "@nomicfoundation/hardhat-ethers/signers";
import {expect} from "chai";
import {ethers} from "hardhat";
import {PrivateSale, PrivateSale__factory, VRVBeta} from "../typechain-types";
import {EIP712Domain, EIP712TypeDefinition} from "../helpers/EIP712.types";
import {signTypedData} from "../helpers/EIP712";


describe("Private sell smart contract", function () {

  let vrvToken: VRVBeta;
  let sellToken: PrivateSale;
  let sellFactory: PrivateSale__factory;
  let sellAddress: string;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  const bidTypes: EIP712TypeDefinition = {
    BidRequest: [
      {name: "to", type: "address"},
      {name: "tokenAmount", type: "uint256"},
      {name: "amount", type: "uint256"},
      {name: "cost", type: "uint256"},
      {name: "requestValue", type: "uint256"},
      {name: "wave", type: "uint8"},
    ]
  };

  const depositTypes: EIP712TypeDefinition = {
    DepositRequest: [
      { name: "to", type: "address" },
      { name: "tokenAmount", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "cost", type: "uint256" },
      { name: "requestValue", type: "uint256" },
      { name: "wave", type: "uint8" },
      { name: "expireTo", type: "uint256" },
      { name: "notBid", type: "bool" }
    ]
  };

  let domain: EIP712Domain;
  let currentTime: number;

  const SIGNING_DOMAIN = "VERVPRIVATESALE";
  const SIGNATURE_VERSION = "1";

  const VERV_INIT_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
  const WAVE_INIT_DEFAULT: bigint = 750_000_000_000_000_000_000_000n;

  const SOFT_DEFAULT: bigint = 15_000_000_000_000_000_000n;
  const HARD_DEFAULT: bigint = 40_000_000_000_000_000_000n;

  const AUTO_FINISH: number = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 12);

  async function deployFixture() {
    let [coinOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("VRVBeta", coinOwner));
    const contractInitSupply = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 30);

    let vrvContract = await factory.deploy(VERV_INIT_DEFAULT, contractInitSupply);

    await vrvContract.waitForDeployment();

    const factorySale = (await ethers.getContractFactory("PrivateSale", coinOwner));

    let contractSale = await factorySale.deploy(await vrvContract.getAddress());

    await contractSale.waitForDeployment();

    return {vrvContract, contractSale, factorySale};
  }

  async function isOpened() {
    expect(await sellToken.opened()).to.equal(true);
    expect(await sellToken.closed()).to.equal(false);
  }

  async function isClosed() {
    expect(await sellToken.opened()).to.equal(false);
    expect(await sellToken.closed()).to.equal(true);
  }

  async function openSale() {
    await expect(sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
        .to.emit(sellToken, "SaleOpened");

    await isOpened();
  }

  async function balance(actual:any) {
    expect(await sellToken.getBalance())
        .to.be.equal(actual)
  }

  async function tokenBalance(actual:any) {
    expect(await sellToken.getTokenBalance())
        .to.be.equal(actual)
  }

  async function bidSum(actual:any) {
    expect(await sellToken.getBidSum())
        .to.be.equal(actual)
  }

  async function depositSum(actual:any) {
    expect(await sellToken.getDepositSum())
        .to.be.equal(actual)
  }

  async function soldSum(actual:any) {
    expect(await sellToken.getSoldSum())
        .to.be.equal(actual)
  }

  async function transferVRV() {
      await expect (vrvToken.transfer(sellAddress, VERV_INIT_DEFAULT))
          .to.changeTokenBalance(vrvToken, sellAddress, VERV_INIT_DEFAULT)
  }

  async function rawBid(signer: SignerWithAddress, wave: number = 0) {

    const bid = {
        to: addr1.address,
        tokenAmount: 1000000000000000000000n,
        amount: 7178957041000000,
        cost: 7178957041000,
        requestValue: 717895704100000,
        wave: wave
    };

    const signature = await signTypedData(domain, bidTypes, bid, signer);

    const data = sellFactory.interface.encodeFunctionData("bid", [{...bid, signature}]);

    return {bid, signature, data};
  }

  async function bet(wave: number) {
    const {bid, signature, data} = await rawBid(owner, wave);

    await time.setNextBlockTimestamp(currentTime + 10);

    await expect(addr1.sendTransaction({
      to: sellAddress,
      data: data,
      value: bid.requestValue
    })).to.emit(sellToken, "Bet").withArgs(addr1.address, [
      bid.to,
      bid.tokenAmount,
      bid.amount,
      bid.cost,
      bid.requestValue,
      bid.wave,
      currentTime + 10
    ]);

    currentTime = Math.round(Date.now() / 1000);
  }

  async function getWaveInfo(wave: number) {
    return await sellToken.getWaveInfo(wave);
  }

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const {vrvContract, contractSale, factorySale} = await loadFixture(deployFixture);

    vrvToken = vrvContract;
    sellToken = contractSale;
    sellFactory = factorySale;

    sellAddress = await sellToken.getAddress();

    domain = {
      name: SIGNING_DOMAIN,
      version: SIGNATURE_VERSION,
      chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId) as number,
      verifyingContract: sellAddress,
    }

    currentTime = Math.round(Date.now() / 1000);
  });

  describe("Deployment", function () {

    it("Должен проверить владельца контракта", async function () {
      expect(await sellToken.owner()).to.equal(owner.address);
    });

    it("Должен проверить установленные статусы", async function () {
      expect(await sellToken.opened()).to.equal(false);
      expect(await sellToken.closed()).to.equal(false);
    });
  });

  describe("Start, Stats and Control", function () {
    it("Должен произойти сбой про причине отсутствия прав", async function () {
      await expect(sellToken.connect(addr1).openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
          .to.be
          .revertedWithCustomError(sellToken, "OwnableUnauthorizedAccount");
    });

    it("Должен произойти сбой про причине уже открытой продажи", async function () {
      await openSale();

      await expect(sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
          .to.be
          .revertedWithCustomError(sellToken, "PrivateSaleOpened");
    });

    it("Должен проверить состояние открытия продажи", async function () {
      await transferVRV();
      await openSale();
    });

    it("Должен проверить баланс", async function () {
      await balance(0);
      await tokenBalance(0);

      await transferVRV();
      await tokenBalance(VERV_INIT_DEFAULT);
    });

    it("Должен проверить нулевые значения", async function () {
      await bidSum(0);
      await depositSum(0);
      await soldSum(0);
    });
  });

  describe("Bid", function () {

    it("Должен произойти сбой в создании ставки по причине закрытия продаж", async function () {
      const {bid, signature, data} = await rawBid(owner);

      await time.setNextBlockTimestamp(currentTime + 10);

      await expect(addr1.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен произойти сбой в создании ставки по причине подписи не владельцем контракта", async function () {
      await transferVRV();
      await openSale();
      const {bid, signature, data} = await rawBid(addr1);

      await time.setNextBlockTimestamp(currentTime + 100);

      await expect(addr1.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSignature')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен произойти сбой в создании ставки по причине отправки транзакции другим адресом", async function () {
      await transferVRV();
      await openSale();
      const {bid, signature, data} = await rawBid(owner);

      await time.setNextBlockTimestamp(currentTime + 100);

      await expect(addr2.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSender')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен произойти сбой в создании ставки по причине недостаточной отправки value", async function () {
      await transferVRV();
      await openSale();
      const {bid, signature, data} = await rawBid(owner);

      await time.setNextBlockTimestamp(currentTime + 100);

      await expect(addr1.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue - 100
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleInsufficientBalance')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен произойти сбой в создании ставки по причине указанной не верной волны", async function () {
      await transferVRV();
      await openSale();
      const {bid, signature, data} = await rawBid(owner, 10);

      await time.setNextBlockTimestamp(currentTime + 100);

      await expect(addr1.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен произойти сбой в создании ставки по причине уже сделанной ставки в этой волне", async function () {
      await transferVRV();
      await openSale();
      await bet(0);

      const {bid, signature, data} = await rawBid(owner, 0);

      await time.setNextBlockTimestamp(currentTime + 100);

      await expect(addr1.sendTransaction({
        to: sellAddress,
        data: data,
        value: bid.requestValue
      })).to.revertedWithCustomError(sellToken, 'PrivateSaleDepositBidExist')

      currentTime = Math.round(Date.now() / 1000);
    });

    it("Должен создать ставку", async function () {
      await transferVRV();
      await openSale();
      await bet(0);

      const {bid} = await rawBid(owner, 0);

      await bidSum(bid.requestValue);

      const waveInfo = await getWaveInfo(0);

      expect(waveInfo[0]).to.equal(0);
      expect(waveInfo[2]).to.equal(bid.requestValue);
      expect(waveInfo[6]).to.equal(1);
    });

    it("Должен получить ставку", async function () {
      await transferVRV();
      await openSale();
      const sendTime = currentTime + 10;
      await bet(0);

      const {bid} = await rawBid(owner, 0);

      await bidSum(bid.requestValue);

      const bidInContract = await sellToken.getBid(addr1.address, 0);

      expect(bidInContract[0]).to.equal(addr1.address);
      expect(bidInContract[1]).to.equal(bid.tokenAmount);
      expect(bidInContract[2]).to.equal(bid.amount);
      expect(bidInContract[3]).to.equal(bid.cost);
      expect(bidInContract[4]).to.equal(bid.requestValue);
      expect(bidInContract[5]).to.equal(0);
      expect(bidInContract[6]).to.equal(sendTime);
    });
  });

  describe("Deposit", function () {

  });

  describe("AfterWave", function () {

  });

  describe("Log", function () {
    it("Должен получить список логов", async function () {
    });

  });

  describe("Finish", function () {

  });

//
//   describe("Deposit", function () {
//
//     it("Должен произойти сбой совершении депозита по причине подписи не владельцем контракта", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, addr2);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleFailedSignature')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине верной волны", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 10,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине отправки транзакции другим пользователем", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr2.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleFailedSender')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине не достаточного количества Eth", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleInsufficientBalance()')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине отсутствия нужного количества VRV в текущей волне", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: VERV_INIT_DEFAULT,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(
//           sellToken, "PrivateSaleWaveLimitExceeded"
//       )
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине вызова транзакции после истечения установленного срока", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: VERV_INIT_DEFAULT,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 3600);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleDepositExpired()')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//     });
//
//     it("Должен произойти сбой совершении депозита по причине автоматического закрытия продажи", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: VERV_INIT_DEFAULT,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(AUTO_FINISH);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleSaleIsFinish()')
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//     });
//
//     it("Должен произойти сбой совершении депозита по причине завершения торгов", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(71789570410000, 717895704100000, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount
//       })).to.emit(sellToken, "Deposited").withArgs(addr1.address, [
//         dep.tokenAmount,
//         dep.amount,
//         dep.cost,
//         dep.wave,
//         current + 100,
//         0
//       ]).emit(sellToken, "SaleClosed");
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(749000000000000000000000n);
//       expect(stats[2]).to.equal(7178957041000000n);
//       expect(stats[3]).to.equal(1000000000000000000000n);
//       expect(stats[4]).to.equal(1);
//
//       expect(await sellToken.getBalance()).to.equal(dep.amount);
//       expect(await sellToken.getTokenBalance()).to.equal(VERV_INIT_DEFAULT);
//       expect(await sellToken.depositSum()).to.equal(dep.amount);
//       expect(await sellToken.tokenDepositSum()).to.equal(dep.tokenAmount);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount - 100
//       })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleSaleIsFinish()')
//     });
//
//     it("Должен совершить депозит", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount
//       })).to.emit(sellToken, "Deposited").withArgs(addr1.address, [
//         dep.tokenAmount,
//         dep.amount,
//         dep.cost,
//         dep.wave,
//         current + 100,
//         0
//       ]);
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(749000000000000000000000n);
//       expect(stats[2]).to.equal(7178957041000000n);
//       expect(stats[3]).to.equal(1000000000000000000000n);
//       expect(stats[4]).to.equal(1);
//
//       expect(await sellToken.getBalance()).to.equal(dep.amount);
//       expect(await sellToken.getTokenBalance()).to.equal(VERV_INIT_DEFAULT);
//       expect(await sellToken.depositSum()).to.equal(dep.amount);
//       expect(await sellToken.tokenDepositSum()).to.equal(dep.tokenAmount);
//     });
//   });
//
//   describe("Finish", function () {
//
//     it("Должен произойти сбой по причине открытых продаж", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//       await expect(sellToken.commit(owner.address, 1)).to.be.revertedWithCustomError(sellToken, 'PrivateSaleSaleIsOpen()')
//     });
//
//     it("Должен произойти сбой по причине вызовом метода не владельцем контракта", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       await expect(sellToken.connect(addr2).commit(owner.address, 1)).to.be.revertedWithCustomError(sellToken, 'OwnableUnauthorizedAccount')
//     });
//
//     it("Должен произойти возврат из за не набранного soft", async function () {
//
//     });
//
//     it("Должен произойти перевод EHT и остатков VRV на баланс владельца при набранном soft", async function () {
//
//       await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);
//
//       await sellToken.openSale(1, 2, WAVE_INIT_DEFAULT, AUTO_FINISH);
//
//       let current = Math.round(Date.now() / 1000);
//
//       const dep = {
//         to: addr1.address,
//         tokenAmount: 1000000000000000000000n,
//         amount: 7178957041000000,
//         cost: 7178957041000,
//         wave: 0,
//         expireTo: current + 3600
//       };
//
//       const signature = await signTypedData(domain, types, dep, owner);
//
//       const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
//
//       let stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(750000000000000000000000n);
//       expect(stats[2]).to.equal(0);
//       expect(stats[3]).to.equal(0);
//       expect(stats[4]).to.equal(0);
//
//       await time.setNextBlockTimestamp(current + 100);
//
//       await expect(addr1.sendTransaction({
//         to: sellAddress,
//         data: data,
//         value: dep.amount
//       })).to.emit(sellToken, "Deposited").withArgs(addr1.address, [
//         dep.tokenAmount,
//         dep.amount,
//         dep.cost,
//         dep.wave,
//         current + 100,
//         0
//       ]).emit(sellToken, "SaleClosed");
//
//       stats = await sellToken.getStats(0);
//       expect(stats[0]).to.equal(0);
//       expect(stats[1]).to.equal(749000000000000000000000n);
//       expect(stats[2]).to.equal(7178957041000000n);
//       expect(stats[3]).to.equal(1000000000000000000000n);
//       expect(stats[4]).to.equal(1);
//
//       expect(await sellToken.getBalance()).to.equal(dep.amount);
//       expect(await sellToken.getTokenBalance()).to.equal(VERV_INIT_DEFAULT);
//       expect(await sellToken.depositSum()).to.equal(dep.amount);
//       expect(await sellToken.tokenDepositSum()).to.equal(dep.tokenAmount);
//
//       let tokenBalance = await sellToken.getTokenBalance();
//       let balance = await sellToken.getBalance();
//       const tx = sellToken.commit(addr2.address, balance);
//
//       await expect(tx).to.changeTokenBalance(vrvToken, addr2, tokenBalance);
//       await expect(tx).to.changeEtherBalance(addr2, balance);
//     });
//
//   });
//
});
