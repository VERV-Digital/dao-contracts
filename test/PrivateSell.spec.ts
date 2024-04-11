import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VRVBeta } from "../typechain-types";


describe("Private sell smart contract", function () {

  let vrvToken: VRVBeta;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  async function deployCoinFixture() {
    let [coinOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("VRVBeta", coinOwner));

    const initSupply = (10 ** 10).toString()

    let contract = await factory.deploy(ethers.parseEther(initSupply));

    await contract.waitForDeployment();

    return contract;
  }

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    vrvToken = await loadFixture(deployCoinFixture);

  });

  describe("Deployment", function () {

    it("Должен проверить владельца контракта", async function () {
    });

  });


  describe("Stats and Control", function () {

    it("Должен проверить наличие VRV на балансе", async function () {
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

    });
  });

  describe("Finish", function () {

    it("Должен произойти возврат из за не набранного soft", async function () {

    });

    it("Должен произойти перевод EHT и остатков VRV на баланс владельца при набранном soft", async function () {

    });

  });

});
