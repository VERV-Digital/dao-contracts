import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VRVBeta } from "../../typechain-types";


describe("Base ERC20 coin VRV-Beta Token", function () {

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

    it("Должен проверить распределение initSupply", async function () {
    });

  });


  describe("Minting", function () {

    it("Должен произойти сбой в чеканке по причине нет прав owner", async function () {
    });

    it("Должен произойти сбой в чеканке по причине нельзя чеканить для себя", async function () {
    });

    it("Должен отчеканить монеты", async function () {
    });

  });

  describe("Transfers", function () {

    it("Должен произойти сбой в отправке токенов между адресами по причине отсутствия нужного количества", async function () {

    });

    it("Должен произойти сбой в отправке токенов между адресами по причине отсутствия нужного количества для оплаты комиссии", async function () {

    });

    it("Должен отправить токены между адресами", async function () {

    });

  });

  describe("Burning", function () {

    it("Должен произойти сбой в сжигании своих токенов по причине отсутствия нужного количества", async function () {

    });

    it("Должен сжечь свои токены", async function () {

    });

  });

});