import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VRVBeta } from "../typechain-types/contracts/VRVBeta";
import { VervID,  } from "../typechain-types/contracts/VervID";


describe("Verv ID Token", function () {

  let vervIDToken: VervID;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const vervIDFactory = (await ethers.getContractFactory("VervID", owner));

    vervIDToken = await vervIDFactory.deploy()

    await vervIDToken.waitForDeployment();

  });

  describe("Deployment", function () {

    it("Check that Ids are missing", async function () {
      expect(await vervIDToken.totalSupply()).to.equal(0);
    });

  });

  describe("Mint", function () {

    it("We issue a test ID", async function () {

      const data = {
        owner: owner.address,
        firstName: "Max",
        lastName: "Goriavin",
        citizenship: ["Moscow", "Kiew", "London"],
        sex: true,
        gender: "dworf",
        birthDate: "01.01.2023",
        birthPlace: "Germany",
        issuer: addr2.address
      }

      const current = Date.now;
      await expect(vervIDToken.mint(data))
        .to
        .emit(vervIDToken, "Mint")
        .withArgs(owner.address, data.owner, 1)
        

      const mintData = await vervIDToken.getByTokenId(1);

      expect(await vervIDToken.balanceOf(data.owner)).to.equal(1);
      expect(await vervIDToken.totalSupply()).to.equal(1);

      console.log(mintData[4].toArray());
      console.log(data.citizenship);
      expect(mintData[0]).to.equal(1);
      expect(mintData[1]).to.equal(data.owner);
      expect(mintData[2]).to.equal(data.firstName);
      expect(mintData[3]).to.equal(data.lastName);
      expect(mintData[4].toArray()).to.equal(data.citizenship);
      expect(mintData[5]).to.equal(data.sex);
      expect(mintData[6]).to.equal(data.gender);
      expect(mintData[7]).to.equal(data.birthDate);
      expect(mintData[8]).to.equal(data.birthPlace);
      expect(mintData[9]).to.equal(data.issuer);
      expect(mintData[10]).to.gt(current);

    });

  });

});
