import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { VRVBeta } from "../../typechain-types";


describe("Base ERC20 coin VRV-Beta Token", function () {

  let vrvToken: VRVBeta;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress

  async function deployCoinFixture() {
    let [coinOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("VRVBeta", coinOwner));

    const contractInitSupply = "750000000000000000000000";
    const rewardsAt = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 30);

    let contract = await factory.deploy(ethers.parseEther(contractInitSupply), rewardsAt);

    await contract.waitForDeployment();

    return {contract};
  }

  beforeEach(async function () {

    [owner, addr1, addr2] = await ethers.getSigners();

    const {contract} = await loadFixture(deployCoinFixture);

    vrvToken = contract;
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

  describe("Rewards", function () {

    it("Должен произойти сбой во всех методах наград по причине ограничения по времени наград", async function () {

      await time.setNextBlockTimestamp(Math.round(Date.now() / 1000) + (60 * 60 * 24 * 30));

      await expect(vrvToken.addReward(addr1.address, 100000))
          .to.be
          .revertedWithCustomError(vrvToken, "VRVBetaRewardsNotAvailable");

      await time.setNextBlockTimestamp(Math.round(Date.now() / 1000) + (61 * 60 * 24 * 30));

      await expect(vrvToken.removeReward(addr1.address))
          .to.be
          .revertedWithCustomError(vrvToken, "VRVBetaRewardsNotAvailable");

      await time.setNextBlockTimestamp(Math.round(Date.now() / 1000) + (62 * 60 * 24 * 30));

      await expect(vrvToken.hasReward())
          .to.be
          .revertedWithCustomError(vrvToken, "VRVBetaRewardsNotAvailable");

      await time.setNextBlockTimestamp(Math.round(Date.now() / 1000) + (63 * 60 * 24 * 30));

      await expect(vrvToken.claimReward())
          .to.be
          .revertedWithCustomError(vrvToken, "VRVBetaRewardsNotAvailable");
    });

    it("Должен произойти сбой в методе addReward по причине отсутствия прав", async function () {
      await expect(vrvToken.connect(addr1).addReward(addr1.address, 100000))
          .to.be
          .revertedWithCustomError(vrvToken, "OwnableUnauthorizedAccount");

      await expect(vrvToken.connect(addr1).removeReward(addr1.address))
          .to.be
          .revertedWithCustomError(vrvToken, "OwnableUnauthorizedAccount");
    });

    it("Должен произойти сбой в методе claimReward по причине отсутствия награды", async function () {
      await expect(vrvToken.connect(addr1).claimReward())
          .to.be
          .revertedWithCustomError(vrvToken, "VRVBetaRewardsNotAvailable");
    });

    it("Должен проверить назначение и выдачу награды пользователю", async function () {
      await vrvToken.addReward(addr1.address, 100000);

      expect(await vrvToken.connect(addr1).hasReward())
          .to.equal(100000);


      expect(await vrvToken.connect(addr1).claimReward())
        .to.changeTokenBalances(vrvToken, [addr1], [100000]);

      expect(await vrvToken.connect(addr1).hasReward())
          .to.equal(0);
    });

    it("Должен удалить награду", async function () {
      await vrvToken.addReward(addr1.address, 100000);

      expect(await vrvToken.connect(addr1).hasReward())
          .to.equal(100000);

      await vrvToken.removeReward(addr1.address);

      expect(await vrvToken.connect(addr1).hasReward())
          .to.equal(0);
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
