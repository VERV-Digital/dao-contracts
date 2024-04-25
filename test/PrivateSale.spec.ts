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
            {name: "to", type: "address"},
            {name: "tokenAmount", type: "uint256"},
            {name: "amount", type: "uint256"},
            {name: "cost", type: "uint256"},
            {name: "requestValue", type: "uint256"},
            {name: "wave", type: "uint8"},
            {name: "expireTo", type: "uint256"},
            {name: "notBid", type: "bool"}
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
    const GAS_LIMIT = 30_000_000n; // only test
    // const GAS_LIMIT = 9007199254740991n; // only coverage

    const AUTO_FINISH: number = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 12);
    const AFTER_WAVE: number = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 12) - 10;

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
            chainId: await ethers.provider.getNetwork().then(({chainId}) => chainId) as number,
            verifyingContract: sellAddress,
        }

        currentTime = Math.round(Date.now() / 1000);
    });

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

    async function openSale() {
        await expect(sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
            .to.emit(sellToken, "SaleOpened");

        await isOpened();
    }

    async function balance(actual: any) {
        expect(await sellToken.getBalance())
            .to.be.equal(actual)
    }

    async function tokenBalance(actual: any) {
        expect(await sellToken.getTokenBalance())
            .to.be.equal(actual)
    }

    async function bidSum(actual: any) {
        expect(await sellToken.getBidSum())
            .to.be.equal(actual)
    }

    async function depositSum(actual: any) {
        expect(await sellToken.getDepositSum())
            .to.be.equal(actual)
    }

    async function soldSum(actual: any) {
        expect(await sellToken.getSoldSum())
            .to.be.equal(actual)
    }

    async function transferVRV() {
        await expect(vrvToken.transfer(sellAddress, VERV_INIT_DEFAULT))
            .to.changeTokenBalance(vrvToken, sellAddress, VERV_INIT_DEFAULT)
    }

    async function rawBid(signer: SignerWithAddress, wave: number = 0, address: SignerWithAddress = addr1) {

        const bid = {
            to: address.address,
            tokenAmount: 1000000000000000000000n,
            amount: 7178957041000000n,
            cost: 7178957041000n,
            requestValue: 717895704100000,
            wave: wave
        };

        const signature = await signTypedData(domain, bidTypes, bid, signer);

        const data = sellFactory.interface.encodeFunctionData("bid", [{...bid, signature}]);

        return {bid, signature, data};
    }

    async function bet(wave: number = 0, address: SignerWithAddress = addr1) {
        const {bid, data} = await rawBid(owner, wave, address);

        await time.setNextBlockTimestamp(currentTime + 35);

        const tx = address.sendTransaction({
            to: sellAddress,
            data: data,
            value: bid.requestValue
        });

        await expect(tx).to.emit(sellToken, "Bet").withArgs(address.address, [
            bid.to,
            bid.tokenAmount,
            bid.amount,
            bid.cost,
            bid.requestValue,
            bid.wave,
            currentTime + 35
        ]);

        await expect(tx).to.changeEtherBalance(address, -bid.requestValue);

        currentTime = currentTime + 35;
    }

    async function rawDeposit(
        signer: SignerWithAddress,
        wave: number = 0,
        tokenAmount: bigint = 1000000000000000000000n,
        notBid: boolean = false,
        amount: bigint = 7178957041000000n,
        address: SignerWithAddress = addr1
    ) {
        const dep = {
            to: address.address,
            tokenAmount: tokenAmount,
            amount: amount,
            cost: 7178957041000n,
            requestValue: 6461061336900000,
            wave: wave,
            expireTo: currentTime + 3600,
            notBid: notBid
        };

        const signature = await signTypedData(domain, depositTypes, dep, signer);

        const data = sellFactory.interface.encodeFunctionData("deposit", [{...dep, signature}]);

        return {dep, signature, data};
    }

    async function deposit(
        wave: number = 0,
        notBid: boolean = false,
        address: SignerWithAddress = addr1,
        amount: bigint = 7178957041000000n
    ) {
        const {dep, data} = await rawDeposit(
            owner,
            wave,
            1000000000000000000000n,
            notBid,
            amount,
            address
        );

        await time.setNextBlockTimestamp(currentTime + 55);

        const tx = address.sendTransaction({
            to: sellAddress,
            data: data,
            value: dep.requestValue
        });

        await expect(tx).to.emit(sellToken, "Deposited").withArgs(address.address, [
            dep.to,
            dep.tokenAmount,
            dep.amount,
            dep.cost,
            dep.requestValue,
            dep.wave,
            currentTime + 55,
            dep.notBid,
            0
        ]);

        await expect(tx).to.changeEtherBalance(address, -dep.requestValue);
        await expect(tx).to.changeTokenBalance(vrvToken, address, dep.tokenAmount);
        await expect(tx).to.changeTokenBalance(vrvToken, sellAddress, -dep.tokenAmount);

        currentTime = currentTime + 55;
    }

    async function getWaveInfo(wave: number) {
        return await sellToken.getWaveInfo(wave);
    }

    async function registerAfterWave() {
        return await sellToken.registerAfterWave(AFTER_WAVE);
    }

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
        it("Должен произойти сбой открытия продажи про причине отсутствия прав", async function () {
            await expect(sellToken.connect(addr1).openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
                .to.be
                .revertedWithCustomError(sellToken, "OwnableUnauthorizedAccount");
        });

        it("Должен произойти сбой открытия продажи про причине уже открытой продажи", async function () {
            await openSale();

            await expect(sellToken.openSale(SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, AUTO_FINISH))
                .to.be
                .revertedWithCustomError(sellToken, "PrivateSaleOpened");
        });

        it("Должен произойти сбой в получении информации о волне по причине указанной не верной волны", async function () {
            await openSale();

            await expect(sellToken.getWaveInfo(10))
                .to.be
                .revertedWithCustomError(sellToken, "PrivateSaleFailedWaveIndex");
        });

        it("Должен проверить состояние открытия продажи", async function () {
            await transferVRV();
            await openSale();

            for (let i = 0; i < 10; i++) {
                let waveInfo = await getWaveInfo(i);

                expect(waveInfo.index).to.equal(i);
                expect(waveInfo.limit).to.equal(WAVE_INIT_DEFAULT);
                expect(waveInfo.bid).to.equal(0);
                expect(waveInfo.bidToken).to.equal(0);
                expect(waveInfo.deposit).to.equal(0);
                expect(waveInfo.depositToken).to.equal(0);
                expect(waveInfo.depositCount).to.equal(0);
                expect(waveInfo.bidCount).to.equal(0);
            }
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

        it("Должен произойти сбой в создании ставки по причине не открытой продажи", async function () {
            const {bid, data} = await rawBid(owner);

            await time.setNextBlockTimestamp(currentTime + 35);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен произойти сбой в создании ставки по причине закрытия продаж", async function () {
            await openSale();

            const {bid, data} = await rawBid(owner);

            await time.setNextBlockTimestamp(AUTO_FINISH + 1);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен произойти сбой в создании ставки по причине подписи не владельцем контракта", async function () {
            await transferVRV();
            await openSale();
            const {bid, data} = await rawBid(addr1);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSignature')
        });

        it("Должен произойти сбой в создании ставки по причине отправки транзакции другим адресом", async function () {
            await transferVRV();
            await openSale();
            const {bid, data} = await rawBid(owner);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr2.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSender')
        });

        it("Должен произойти сбой в создании ставки по причине недостаточной отправки value", async function () {
            await transferVRV();
            await openSale();
            const {bid, data} = await rawBid(owner);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue - 100
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleInsufficientBalance')
        });

        it("Должен произойти сбой в создании ставки по причине указанной не верной волны", async function () {
            await transferVRV();
            await openSale();
            const {bid, data} = await rawBid(owner, 100);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')
        });

        it("Должен произойти сбой в создании ставки по причине уже сделанной ставки в этой волне", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {bid, data} = await rawBid(owner, 0);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: bid.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleDepositBidExist')
        });

        it("Должен создать ставку", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {bid} = await rawBid(owner, 0);

            await bidSum(bid.requestValue);

            const waveInfo = await getWaveInfo(0);

            expect(waveInfo.index).to.equal(0);
            expect(waveInfo.bid).to.equal(bid.requestValue);
            expect(waveInfo.bidToken).to.equal(bid.tokenAmount);
            expect(waveInfo.bidCount).to.equal(1);

            await balance(bid.requestValue);
        });

        it("Должен получить ставку", async function () {
            await transferVRV();
            await openSale();
            const sendTime = currentTime + 35;
            await bet(0);

            const {bid} = await rawBid(owner, 0);

            await bidSum(bid.requestValue);

            const bidInContract = await sellToken.getBid(addr1.address, 0);

            expect(bidInContract.to).to.equal(addr1.address);
            expect(bidInContract.tokenAmount).to.equal(bid.tokenAmount);
            expect(bidInContract.amount).to.equal(bid.amount);
            expect(bidInContract.cost).to.equal(bid.cost);
            expect(bidInContract.requestValue).to.equal(bid.requestValue);
            expect(bidInContract.wave).to.equal(bid.wave);
            expect(bidInContract.createdAt).to.equal(sendTime);
        });
    });

    describe("Deposit", function () {

        it("Должен произойти сбой в создании депозита по причине не открытой продажи", async function () {
            const {dep, data} = await rawDeposit(owner);

            await time.setNextBlockTimestamp(currentTime + 35);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен произойти сбой в создании депозита по причине закрытия продаж", async function () {
            const {dep, data} = await rawDeposit(owner);

            await time.setNextBlockTimestamp(currentTime + 55);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен произойти сбой в создании депозита по причине автоматического закрытия продаж", async function () {
            await openSale();

            const {dep, data} = await rawDeposit(owner);

            await time.setNextBlockTimestamp(AUTO_FINISH + 1);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен произойти сбой в создании депозита по причине подписи не владельцем контракта", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(addr1);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSignature')
        });

        it("Должен произойти сбой в создании депозита по причине отправки транзакции другим адресом", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(owner);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr2.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedSender')
        });

        it("Должен произойти сбой в создании депозита по причине недостаточной отправки value", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(owner);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue - 100
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleInsufficientBalance')
        });

        it("Должен произойти сбой в создании депозита по причине указанной не верной волны", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(owner, 10);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')
        });

        it("Должен произойти сбой в создании депозита по причине указанной не верной волны в режиме AfterWave", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(owner, 11);

            await sellToken.registerAfterWave(currentTime + 35000000);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')
        });

        it("Должен произойти сбой в создании депозита по причине превышения лимита в волне", async function () {
            await transferVRV();
            await openSale();
            const {dep, data} = await rawDeposit(owner, 0, VERV_INIT_DEFAULT);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleWaveLimitExceeded')
        });

        it("Должен произойти сбой в создании депозита по причине отсутствия ставки", async function () {
            await transferVRV();
            await openSale();

            const {dep, data} = await rawDeposit(owner, 0);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleDepositBidNotFound')
        });

        it("Должен произойти сбой в создании депозита по причине покупки токенов больше чем в ставке", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {dep, data} = await rawDeposit(owner, 0, 1000000000000000000001n);

            await time.setNextBlockTimestamp(currentTime + 350);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleDepositFailedTokenAmount')
        });

        it("Должен произойти сбой в создании депозита по причине вызова транзакции после истечения установленного срока", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {dep, data} = await rawDeposit(owner, 0);

            await time.setNextBlockTimestamp(currentTime + 3601);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleDepositExpired')
        });

        it("Должен создать депозит который завершит продажу а затем произойти сбой совершении депозита по причине завершения торгов", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {bid} = await rawBid(owner, 0);
            const {dep, data} = await rawDeposit(owner, 0,
                1000000000000000000000n,
                false,
                HARD_DEFAULT
            );

            await time.setNextBlockTimestamp(currentTime + 55);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.emit(sellToken, "Deposited").withArgs(addr1.address, [
                dep.to,
                dep.tokenAmount,
                dep.amount,
                dep.cost,
                dep.requestValue,
                dep.wave,
                currentTime + 55,
                dep.notBid,
                0
            ]).emit(sellToken, "SaleClosed");

            await depositSum(dep.amount);
            await balance(bid.requestValue + dep.requestValue);

            currentTime = currentTime + 55;

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.be.revertedWithCustomError(sellToken, 'PrivateSaleClosed')
        });

        it("Должен создать депозит", async function () {
            await transferVRV();
            await openSale();
            await bet(0);
            await deposit(0);

            const {bid} = await rawBid(owner, 0);
            const {dep} = await rawDeposit(owner, 0);

            await depositSum(dep.amount);
            await soldSum(dep.tokenAmount);

            const waveInfo = await getWaveInfo(0);

            expect(waveInfo.index).to.equal(0);
            expect(waveInfo.limit).to.equal(WAVE_INIT_DEFAULT - dep.tokenAmount);
            expect(waveInfo.deposit).to.equal(dep.amount);
            expect(waveInfo.depositToken).to.equal(dep.tokenAmount);
            expect(waveInfo.depositCount).to.equal(1);

            await balance(bid.requestValue + dep.requestValue);
        });

        it("Должен создать депозит который закроет продажу", async function () {
            await transferVRV();
            await openSale();
            await bet(0);

            const {bid} = await rawBid(owner, 0);
            const {dep, data} = await rawDeposit(owner, 0,
                1000000000000000000000n,
                false,
                HARD_DEFAULT
            );

            await time.setNextBlockTimestamp(currentTime + 55);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.emit(sellToken, "Deposited").withArgs(addr1.address, [
                dep.to,
                dep.tokenAmount,
                dep.amount,
                dep.cost,
                dep.requestValue,
                dep.wave,
                currentTime + 55,
                dep.notBid,
                0
            ]).emit(sellToken, "SaleClosed");

            await depositSum(dep.amount);
            await balance(bid.requestValue + dep.requestValue);

            currentTime = currentTime + 55;
        });

        it("Должен создать депозит без ставки (выкуп больше 75%)", async function () {
            await transferVRV();
            await openSale();
            await bet(0);
            await deposit(0, true);

            const {bid} = await rawBid(owner, 0);
            const {dep} = await rawDeposit(owner, 0);

            await depositSum(dep.amount);
            await soldSum(dep.tokenAmount);

            const waveInfo = await getWaveInfo(0);

            expect(waveInfo.index).to.equal(0);
            expect(waveInfo.limit).to.equal(WAVE_INIT_DEFAULT - dep.tokenAmount);
            expect(waveInfo.deposit).to.equal(dep.amount);
            expect(waveInfo.depositToken).to.equal(dep.tokenAmount);
            expect(waveInfo.depositCount).to.equal(1);

            await balance(bid.requestValue + dep.requestValue);
        });

        it("Должен получить депозит", async function () {
            await transferVRV();
            await openSale();
            await bet(0);
            const sendTime = currentTime + 55;
            await deposit(0);

            const {dep} = await rawDeposit(owner, 0);

            const depositList = await sellToken.getDepositIndexList();

            const oneDepIndex = depositList[0];

            const depositInContract = await sellToken.getDeposit(oneDepIndex);

            expect(depositInContract.to).to.equal(addr1.address);
            expect(depositInContract.tokenAmount).to.equal(dep.tokenAmount);
            expect(depositInContract.amount).to.equal(dep.amount);
            expect(depositInContract.cost).to.equal(dep.cost);
            expect(depositInContract.requestValue).to.equal(dep.requestValue);
            expect(depositInContract.wave).to.equal(dep.wave);
            expect(depositInContract.createdAt).to.equal(sendTime);
            expect(depositInContract.notBid).to.equal(dep.notBid);
            expect(depositInContract.withdrawal).to.equal(0);
        });
    });

    describe("AfterWave", function () {

        it("Должен произойти сбой открытия регистрации режима AfterWave отсутствия прав", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.connect(addr1).registerAfterWave(AFTER_WAVE))
                .to.be
                .revertedWithCustomError(sellToken, "OwnableUnauthorizedAccount");
        });

        it("Должен произойти сбой открытия регистрации режима AfterWave повторного открытия", async function () {
            await transferVRV();
            await openSale();
            await registerAfterWave();
            await expect(sellToken.registerAfterWave(AFTER_WAVE))
                .to.be
                .revertedWithCustomError(sellToken, "PrivateSaleAfterWaveRegistered");
        });

        it("Должен произойти сбой в получении информации по волне AfterWave по причине включенного режима (waveInfo)", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.getWaveInfo(10))
                .to.be
                .revertedWithCustomError(sellToken, "PrivateSaleFailedWaveIndex");
        });

        it("Должен произойти сбой в получении информации по волне AfterWave по причине включенного режима (getAfterSaleWave)", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.getAfterSaleWave())
                .to.be
                .revertedWithCustomError(sellToken, "PrivateSaleAfterWaveNotRegistered");
        });

        it("Должен произойти сбой получения информации о волне (getAfterSaleWave) по причине отсутствия прав", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.connect(addr1).getAfterSaleWave())
                .to.be
                .revertedWithCustomError(sellToken, "OwnableUnauthorizedAccount");
        });

        it("Должен получить информацию о волне AfterWave", async function () {
            await transferVRV();
            await openSale();
            await registerAfterWave();

            let waveInfo = await getWaveInfo(10);

            expect(waveInfo.index).to.equal(10);
            expect(waveInfo.limit).to.equal(VERV_INIT_DEFAULT);
            expect(waveInfo.bid).to.equal(0);
            expect(waveInfo.bidToken).to.equal(0);
            expect(waveInfo.deposit).to.equal(0);
            expect(waveInfo.depositToken).to.equal(0);
            expect(waveInfo.depositCount).to.equal(0);
            expect(waveInfo.bidCount).to.equal(0);

            waveInfo = await sellToken.getAfterSaleWave();

            expect(waveInfo.index).to.equal(10);
            expect(waveInfo.limit).to.equal(VERV_INIT_DEFAULT);
            expect(waveInfo.bid).to.equal(0);
            expect(waveInfo.bidToken).to.equal(0);
            expect(waveInfo.deposit).to.equal(0);
            expect(waveInfo.depositToken).to.equal(0);
            expect(waveInfo.depositCount).to.equal(0);
            expect(waveInfo.bidCount).to.equal(0);
        });

        it("Должен произойти сбой в создании депозита в режиме AfterWave по причине не верной волны", async function () {
            await transferVRV();
            await openSale();
            await registerAfterWave();

            const {dep, data} = await rawDeposit(owner, 11);

            await time.setNextBlockTimestamp(currentTime + 55);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleFailedWaveIndex')
        });

        it("Должен произойти сбой в создании депозита по причине превышения лимита в AfterWave волне", async function () {
            await transferVRV();
            await openSale();
            await deposit(0, true);
            await registerAfterWave();

            const {dep, data} = await rawDeposit(owner, 10, VERV_INIT_DEFAULT);

            await time.setNextBlockTimestamp(currentTime + 55);

            await expect(addr1.sendTransaction({
                to: sellAddress,
                data: data,
                value: dep.requestValue
            })).to.revertedWithCustomError(sellToken, 'PrivateSaleWaveLimitExceeded')
        });

        it("Должен создать депозит в режиме AfterWave", async function () {
            await transferVRV();
            await openSale();
            await registerAfterWave();
            await deposit(10);

            const {dep} = await rawDeposit(owner, 10);

            await depositSum(dep.amount);
            await soldSum(dep.tokenAmount);

            const waveInfo = await sellToken.getAfterSaleWave();

            expect(waveInfo.index).to.equal(10);
            expect(waveInfo.limit).to.equal(VERV_INIT_DEFAULT - dep.tokenAmount);
            expect(waveInfo.deposit).to.equal(dep.amount);
            expect(waveInfo.depositToken).to.equal(dep.tokenAmount);
            expect(waveInfo.depositCount).to.equal(1);

            await balance(dep.requestValue);
        });
    });

    describe("Log", function () {
        it("Должен получить список логов", async function () {
            await transferVRV();
            await openSale();

            const sendTimeBid = currentTime + 35;
            await bet(0);

            let logs = await sellToken.getLogs();

            const {bid} = await rawBid(owner, 0);
            const bidLog: PrivateSale.LogStructOutput = logs[logs.length - 1];

            expect(bidLog.to).to.equal(bid.to)
            expect(bidLog.action).to.equal(0); // LogAction.Bid = 0
            expect(bidLog.amount).to.equal(bid.amount);
            expect(bidLog.tokenAmount).to.equal(bid.tokenAmount);
            expect(bidLog.cost).to.equal(bid.cost);
            expect(bidLog.wave).to.equal(bid.wave);
            expect(bidLog.createdAt).to.equal(sendTimeBid);

            const sendTimeDep = currentTime + 55;
            await deposit(0);

            logs = await sellToken.getLogs();

            const {dep} = await rawDeposit(owner, 0);

            const depLog: PrivateSale.LogStructOutput = logs[logs.length - 1];

            expect(depLog.to).to.equal(dep.to)
            expect(depLog.action).to.equal(1); // LogAction.Deposit = 1
            expect(depLog.amount).to.equal(dep.amount);
            expect(depLog.tokenAmount).to.equal(dep.tokenAmount);
            expect(depLog.cost).to.equal(dep.cost);
            expect(depLog.wave).to.equal(dep.wave);
            expect(depLog.createdAt).to.equal(sendTimeDep);

            const sendTimeBigDep = currentTime + 55;
            await deposit(0, true);

            logs = await sellToken.getLogs();

            const bigDepLog: PrivateSale.LogStructOutput = logs[logs.length - 1];

            expect(bigDepLog.to).to.equal(dep.to)
            expect(bigDepLog.action).to.equal(2); // LogAction.BigDeposit = 1
            expect(bigDepLog.amount).to.equal(dep.amount);
            expect(bigDepLog.tokenAmount).to.equal(dep.tokenAmount);
            expect(bigDepLog.cost).to.equal(dep.cost);
            expect(bigDepLog.wave).to.equal(dep.wave);
            expect(bigDepLog.createdAt).to.equal(sendTimeBigDep);
        });

        it("Должен получить большой список логов", async function () {
            await transferVRV();
            await openSale();

            let actual = 0;
            for (let wave = 0; wave < 10; wave++) {
                for (let i = 0; i < addrs.length; i++) {
                    await bet(wave, addrs[i]);
                    actual++;
                    await deposit(wave, false, addrs[i]);
                    actual++;
                }
            }

            let logs = await sellToken.getLogs();

            expect(logs.length).to.equal(actual);
        });
    });

    describe("Finish", function () {

        it("Должен произойти сбой по причине открытых продаж", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.finish(owner.address))
                .to.be.revertedWithCustomError(sellToken, 'PrivateSaleOpened')
        });

        it("Должен произойти сбой по причине вызовом метода не владельцем контракта", async function () {
            await transferVRV();
            await openSale();
            await expect(sellToken.connect(addr1).finish(owner.address))
                .to.be.revertedWithCustomError(sellToken, 'OwnableUnauthorizedAccount')
        });

        it("Должен произойти возврат из за не набранного soft", async function () {
            await transferVRV();
            await openSale();
            for (let wave = 0; wave < 10; wave++) {
                for (let i = 0; i < addrs.length; i++) {
                    await bet(wave, addrs[i]);
                    await deposit(wave, false, addrs[i]);
                }
            }

            const depositList = await sellToken.getDepositIndexList();

            let revertSum: bigint = 0n;
            let addressRewert = {};

            let fee = GAS_LIMIT / BigInt(depositList.length);

            const balance = await sellToken.getBalance();

            await time.setNextBlockTimestamp(AUTO_FINISH + 1);

            const tx = sellToken.finish(owner.address, {gasLimit: GAS_LIMIT});


            for (let i = 0; i < depositList.length; i++) {

                let depositInContract = await sellToken.getDeposit(i);

                revertSum += depositInContract.requestValue - fee;

                // @ts-ignore
                if (addressRewert[depositInContract.to] == undefined) {
                    // @ts-ignore
                    addressRewert[depositInContract.to] = depositInContract.requestValue - fee;
                } else {
                    // @ts-ignore
                    addressRewert[depositInContract.to] += depositInContract.requestValue - fee;
                }
            }

            for (let i = 0; i < addrs.length; i++) {
                await expect(tx)
                    // @ts-ignore
                    .to.changeEtherBalance(addrs[i], addressRewert[addrs[i].address]);
            }

            await expect(tx)
                .to.changeEtherBalance(owner, balance - revertSum);

            await expect(sellToken.finish(owner.address, {gasLimit: GAS_LIMIT}))
                .changeEtherBalance(owner, 0);
        });

        it("Должен произойти перевод EHT и остатков VRV на баланс владельца при набранном soft", async function () {
            await transferVRV();
            await openSale();

            for (let wave = 0; wave < 10; wave++) {
                for (let i = 0; i < addrs.length; i++) {
                    await bet(wave, addrs[i]);
                    await deposit(wave, false, addrs[i]);
                }
            }

            await bet(9, addr1);
            await deposit(9, false, addr1, HARD_DEFAULT);

            const balance = await sellToken.getBalance();
            const tokenBalance = await sellToken.getTokenBalance();

            const tx = sellToken.finish(owner.address);

            await expect(tx)
                .to.changeEtherBalance(owner, balance);
            await expect(tx)
                .to.changeTokenBalance(vrvToken, owner, tokenBalance);
        });
    });
});
