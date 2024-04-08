import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Manager  } from "../typechain-types";


describe("Manager", function () {

  let managerContract: Manager;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress
  let addrs: SignerWithAddress[];

  async function deployManagerFixture() {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const managerFactory = (await ethers.getContractFactory("Manager", owner));

    managerContract = await managerFactory.deploy(owner.address)

    await managerContract.waitForDeployment();
  }

  beforeEach(async function () {

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const managerFactory = (await ethers.getContractFactory("Manager", owner));

    managerContract = await managerFactory.deploy(owner.address)

    await managerContract.waitForDeployment();

  });

  describe("Deployment", function () {

    it("Make sure there are no contract addresses", async function () {
      await expect(await managerContract.getIndividualDocument())
          .to.be.revertedWithCustomError(managerContract, "AccessManagerContractAddressMissing");
    });

  });

  // describe("Mint", function () {
  //
  //   it("We issue a test ID", async function () {
  //
  //     const data = {
  //       owner: owner.address,
  //       firstName: "Max",
  //       lastName: "Goriavin",
  //       citizenship: ["Moscow", "Kiew", "London"],
  //       sex: true,
  //       gender: "dworf",
  //       birthDate: "01.01.2023",
  //       birthPlace: "Germany",
  //       issuer: addr2.address
  //     }
  //
  //     const current = Date.now;
  //     await expect(vervIDToken.mint(data))
  //       .to
  //       .emit(vervIDToken, "Mint")
  //       .withArgs(owner.address, data.owner, 1)
  //
  //
  //     const mintData = await vervIDToken.getByTokenId(1);
  //
  //     expect(await vervIDToken.balanceOf(data.owner)).to.equal(1);
  //     expect(await vervIDToken.totalSupply()).to.equal(1);
  //
  //     console.log(mintData[4].toArray());
  //     console.log(data.citizenship);
  //     expect(mintData[0]).to.equal(1);
  //     expect(mintData[1]).to.equal(data.owner);
  //     expect(mintData[2]).to.equal(data.firstName);
  //     expect(mintData[3]).to.equal(data.lastName);
  //     expect(mintData[4].toArray()).to.equal(data.citizenship);
  //     expect(mintData[5]).to.equal(data.sex);
  //     expect(mintData[6]).to.equal(data.gender);
  //     expect(mintData[7]).to.equal(data.birthDate);
  //     expect(mintData[8]).to.equal(data.birthPlace);
  //     expect(mintData[9]).to.equal(data.issuer);
  //     expect(mintData[10]).to.gt(current);
  //
  //   });
  //
  // });

});
