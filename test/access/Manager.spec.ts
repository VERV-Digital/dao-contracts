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

    it("Должен проверить владельца контракта", async function () {
    });

    it("Должен проверить адреса контактов", async function () {
    });

  });

  describe("Change owner", function () {

    it("Должен произойти сбой в смене владельца по причине отсутствия прав", async function () {
    });

    it("Должен сменить владельца контракта", async function () {
    });

  });

  describe("Get role and node", function () {

    it("Должен ввернуть роль Investor", async function () {
    });

    it("Должен ввернуть роль Alien", async function () {
    });

    it("Должен ввернуть роль Citizen", async function () {
    });

    it("Должен ввернуть роль PEN", async function () {
    });

    it("Должен ввернуть роль Commander", async function () {
    });

  });

});
