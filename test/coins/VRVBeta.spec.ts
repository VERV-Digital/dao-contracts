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
  let initSupply: string;

  async function deployCoinFixture() {
    let [coinOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("VRVBeta", coinOwner));

    const contractInitSupply = "750000000000000000000000"

    let contract = await factory.deploy(ethers.parseEther(contractInitSupply));

    await contract.waitForDeployment();

    return {contract, contractInitSupply};
  }

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const {contract, contractInitSupply} = await loadFixture(deployCoinFixture);

    vrvToken = contract;
    initSupply = contractInitSupply;
  });

  describe("Deployment", function () {

    it("Должен проверить владельца контракта", async function () {
      expect(await vrvToken.owner()).to.equal(owner.address);
    });

    it("Должен проверить распределение initSupply", async function () {

      const ownerBalance = await vrvToken.balanceOf(owner.address);

      expect(await vrvToken.totalSupply()).to.equal(
          ownerBalance
      );
    });

  });


  describe("Minting", function () {

    it("Должен произойти сбой в чеканке по причине нет прав owner", async function () {
      await expect(vrvToken.connect(addr2).mint(addr1.address, 100000))
          .to.be
          .reverted;
    });

    it("Должен произойти сбой в чеканке по причине нельзя чеканить для себя", async function () {
      await expect(vrvToken.connect(owner).mint(owner.address, 100000))
          .to.be
          .reverted;
    });

    it("Должен отчеканить монеты", async function () {
      await expect(
          vrvToken.connect(owner).mint(addr1.address, 100000)
      ).to.changeTokenBalances(vrvToken, [addr1], [100000]);
    });

  });

  describe("Transfers", function () {

    it("Должен произойти сбой в отправке токенов между адресами по причине отсутствия нужного количества", async function () {
      await expect(
          vrvToken.connect(addr1).transfer(addr2.address, 50)
      ).to.be.reverted;
    });

    it("Должен отправить токены между адресами", async function () {
      await expect(vrvToken.connect(owner).transfer(addr2.address, 50))
          .to.emit(vrvToken, "Transfer")
          .withArgs(owner.address, addr2.address, 50);

      await expect(vrvToken.connect(addr2).transfer(addr1.address, 50))
          .to.changeTokenBalances(vrvToken, [addr1], [50]);
    });

  });

  describe("Burning", function () {

    it("Должен произойти сбой в сжигании своих токенов по причине отсутствия нужного количества", async function () {
      await expect(vrvToken.connect(addr2).burn(50))
          .to.be.reverted;
    });

    it("Должен сжечь свои токены", async function () {
      await expect(vrvToken.connect(owner).transfer(addr2.address, 50))
          .to.emit(vrvToken, "Transfer")
          .withArgs(owner.address, addr2.address, 50);

      await expect(vrvToken.connect(addr2).burn(50))
          .to.changeTokenBalances(vrvToken, [addr2], [-50]);
    });

  });

});
