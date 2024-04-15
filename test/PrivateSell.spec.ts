import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {PrivateSell, PrivateSell__factory, VRVBeta} from "../typechain-types";
import {EIP712Domain, EIP712TypeDefinition} from "../helpers/EIP712.types";
import {signTypedData} from "../helpers/EIP712";
import {splitSignature} from "@ethersproject/bytes";


describe("Private sell smart contract", function () {

  let vrvToken: VRVBeta;
  let sellToken: PrivateSell;
  let sellFactory: PrivateSell__factory;
  let sellAddress: string;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  const types: EIP712TypeDefinition = {
    DepositRequest: [
      { name: "to", type: "address" },
      { name: "tokenAmount", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "cost", type: "uint256" },
      { name: "wave", type: "uint8" }
    ]
  };

  let domain: EIP712Domain;


  const SIGNING_DOMAIN = "VERVPRIVATESELL";
  const SIGNATURE_VERSION = "1";

  const VERV_INIT_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
  const WAVE_INIT_DEFAULT: bigint = 750_000_000_000_000_000_000_000n;

  const SOFT_DEFAULT: bigint = 15_000_000_000_000_000_000n;
  const HARD_DEFAULT: bigint = 40_000_000_000_000_000_000n;

  async function deployFixture() {
    let [coinOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("VRVBeta", coinOwner));

    let vrvContract = await factory.deploy(VERV_INIT_DEFAULT);

    await vrvContract.waitForDeployment();

    const factorySell = (await ethers.getContractFactory("PrivateSell", coinOwner));

    let contractSell = await factorySell.deploy(await vrvContract.getAddress());

    await contractSell.waitForDeployment();

    return {vrvContract, contractSell, factorySell};
  }

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const {vrvContract, contractSell, factorySell} = await loadFixture(deployFixture);

    vrvToken = vrvContract;
    sellToken = contractSell;
    sellFactory = factorySell;

    sellAddress = await sellToken.getAddress();

    domain = {
      name: SIGNING_DOMAIN,
      version: SIGNATURE_VERSION,
      chainId: await ethers.provider.getNetwork().then(({ chainId }) => chainId) as number,
      verifyingContract: sellAddress,
    }
  });

  describe("Deployment", function () {

    it("Должен проверить владельца контракта", async function () {
      expect(await sellToken.owner()).to.equal(owner.address);
    });

  });


  describe("Start, Stats and Control", function () {

    it("Должен проверить отсутствие VRV на балансе", async function () {
      expect(await vrvToken.balanceOf(await sellToken.getAddress())).to.equal(0);
    });

    it("Должен проверить наличие VRV на балансе", async function () {
      await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);

      expect(await vrvToken.balanceOf(await sellToken.getAddress())).to.equal(VERV_INIT_DEFAULT);
    });

    it("Должен получить информацию о состоянии токена", async function () {
    });

    it("Должен установить текущую волну и стоимость", async function () {
    });

    it("Должен проверить состояние открытия продажи", async function () {
    });

  });

  describe("Deposit", function () {

    it("Должен произойти сбой совершении депозита по причине не достаточного количества Eth", async function () {

    });

    it("Должен произойти сбой совершении депозита по причине отсутствия нужного количества VRV в текущей волне", async function () {

    });

    it("Должен произойти сбой совершении депозита по причине завершения торгов", async function () {

    });

    it("Должен совершить депозит", async function () {

      await vrvToken.transfer(await sellToken.getAddress(), VERV_INIT_DEFAULT);

      await sellToken.openSell(SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT);

      const dep = {
        to: addr1.address,
        tokenAmount: 1000,
        amount: 7178957041000000,
        cost: 7178957041000,
        wave: 1
      };

      const signature = await signTypedData(domain, types, dep, owner);

      const { v, r, s } = splitSignature(signature)

      console.log(v, r, s);

      const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);
      console.log("data", data);
      console.log({...dep, signature});
      console.log("signature", signature);
      console.log("contract", await sellToken.getAddress());
      console.log("owner", owner.address);
      console.log("sender", addr1.address);
      console.log("getChainID", await sellToken.getChainID());

      console.log(await sellToken.getStats(1));

      await addr1.sendTransaction({
        // from: addr1.address,
        to: await sellToken.getAddress(),
        data: data,
        value: dep.amount
      })

      console.log(await sellToken.getStats(1));

    });
  });

  describe("Finish", function () {

    it("Должен произойти возврат из за не набранного soft", async function () {

    });

    it("Должен произойти перевод EHT и остатков VRV на баланс владельца при набранном soft", async function () {

    });

  });

});
