import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VRVBeta } from "../typechain-types";


describe("VRVBeta Token", function () {

  let vrvToken: VRVBeta;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const vrvTokenFactory = (await ethers.getContractFactory("VRVBeta", owner));

    const initSupply = (10 ** 10).toString()
    
    vrvToken = await vrvTokenFactory.deploy(ethers.parseEther(initSupply))

    await vrvToken.waitForDeployment();

  });

  describe("Deployment", function () {

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await vrvToken.balanceOf(owner.address);
      expect(await vrvToken.totalSupply()).to.equal(ownerBalance);
    });

  });

  describe("Transactions", function () {

    it("Should transfer tokens between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await vrvToken.transfer(addr1.address, 50);
      const addr1Balance = await vrvToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await vrvToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await vrvToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn’t have enough tokens", async function () {
      const initialOwnerBalance = await vrvToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        vrvToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(vrvToken, "ERC20InsufficientBalance");

      // Owner balance shouldn't have changed.
      expect(await vrvToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = BigInt(await vrvToken.balanceOf(owner.address));

      // Transfer 100 tokens from owner to addr1.
      await vrvToken.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await vrvToken.transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await vrvToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - BigInt(150));

      const addr1Balance = await vrvToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await vrvToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

  });

});
