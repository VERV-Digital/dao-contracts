import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { Manager  } from "../../typechain-types";

describe("Access Manager", function () {

  let managerContract: Manager;
  let owner: SignerWithAddress;
  // let addr1: SignerWithAddress;
  // let addr2: SignerWithAddress
  // let addrs: SignerWithAddress[];

  async function deployManagerFixture() {
    let [managerOwner] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("Manager", managerOwner));

    let contract = await factory.deploy(managerOwner.address);

    await contract.waitForDeployment();

    return contract;
  }

  beforeEach(async function () {

    [owner, /*addr1, addr2, ...addrs*/] = await ethers.getSigners();

    managerContract = await loadFixture(deployManagerFixture);
  });

  describe("Deployment", function () {
    it("Make sure there are no contract addresses", async function () {
      // console.log(await managerContract.getIndividualDocument());
      await expect(managerContract.getIndividualDocument())
          .to.be.revertedWithCustomError(managerContract, "AccessManagerContractAddressMissing()");
    });

  });
});
