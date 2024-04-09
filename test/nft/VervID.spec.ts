import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VervID,  } from "../../typechain-types";


describe("ERC721 Verv ID Token", function () {

  // let vervIDToken: VervID;
  // let owner: SignerWithAddress;
  // let addr1: SignerWithAddress;
  // let addr2: SignerWithAddress
  // let addrs: SignerWithAddress[];

  beforeEach(async function () {

    // [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    //
    // const vervIDFactory = (await ethers.getContractFactory("VervID", owner));
    //
    // vervIDToken = await vervIDFactory.deploy()
    //
    // await vervIDToken.waitForDeployment();

  });

  describe("Deployment", function () {

    it("Должен проверить владельца контракта", async function () {
    });

    it("Должен проверить адреса контактов", async function () {
    });

  });

  describe("Change access manager", function () {

    it("Должен произойти сбой в смене Access Manager по причине недостатка прав", async function () {
    });

    it("Должен установить Access Manager и проверить что он установлен", async function () {
    });


    it("Должен проверить сменить адрес Access Manager и проверить что он сменился", async function () {
    });

  });

  describe("Minting", function () {

    it("Должен произойти сбой в чеканке по причине наличия vId у адреса", async function () {
    });

    it("Должен произойти сбой в чеканке по причине отсутствия необходимой роли", async function () {
    });

    it("Должен произойти сбой в чеканке по причине отсутствия необходимой node у роли PEN", async function () {
    });

    it("Должен отчеканить токен", async function () {
    });

    // it("We issue a test ID", async function () {
    //
    //   const data = {
    //     owner: owner.address,
    //     firstName: "Max",
    //     lastName: "Goriavin",
    //     citizenship: ["Moscow", "Kiew", "London"],
    //     sex: true,
    //     gender: "dworf",
    //     birthDate: "01.01.2023",
    //     birthPlace: "Germany",
    //     issuer: addr2.address
    //   }
    //
    //   const current = Math.round(Date.now() / 1000);
    //   await expect(vervIDToken.mint(data))
    //     .to
    //     .emit(vervIDToken, "Mint")
    //     .withArgs(owner.address, data.owner, 1)
    //
    //
    //   const mintData = await vervIDToken.getByTokenId(1);
    //
    //   expect(await vervIDToken.balanceOf(data.owner)).to.equal(1);
    //   expect(await vervIDToken.totalSupply()).to.equal(1);
    //
    //   // console.log(mintData[4].toArray());
    //   expect(mintData[0]).to.equal(1);
    //   expect(mintData[1]).to.equal(data.owner);
    //   expect(mintData[2]).to.equal(data.firstName);
    //   expect(mintData[3]).to.equal(data.lastName);
    //   // expect(mintData[4].toArray()).to.equal(data.citizenship);
    //   expect(mintData[5]).to.equal(data.sex);
    //   expect(mintData[6]).to.equal(data.gender);
    //   expect(mintData[7]).to.equal(data.birthDate);
    //   expect(mintData[8]).to.equal(data.birthPlace);
    //   expect(mintData[9]).to.equal(data.issuer);
    //   expect(mintData[10]).to.greaterThan(current);
    //
    // });

  });


  describe("Get detail", function () {

    it("Должен произойти сбой в получении tokenURI из за отсутствия токена", async function () {
    });

    it("Должен получить адрес tokenURI", async function () {
    });

    it("Должен произойти сбой в получении детальной информации из за отсутствия токена", async function () {
    });

    it("Должен получить краткую форму детальной информации", async function () {
    });

    it("Должен получить краткую форму детальной информации из за роли PEN но с другим node", async function () {
    });

    it("Должен получить полную детальную информацию владелец", async function () {
    });

    it("Должен получить полную детальную информацию адрес из списка разрешенных", async function () {
    });

    it("Должен получить полную детальную информацию с ролью Commander", async function () {
    });

    it("Должен получить полную детальную информацию с ролью PEN", async function () {
    });

    it("Должен произойти сбой в получении срока жизни токена из за отсутствия токена", async function () {
    });

    it("Должен получить срок жизни токена", async function () {

    });
  });

  describe("Transfers", function () {

    it("Должен произойти сбой в методе transfer токена", async function () {
    });

  });

  describe("Burning", function () {

    it("Должен произойти сбой в сжигании токена по причине отсутствия токена", async function () {

    });

    it("Должен произойти сбой в сжигании токена по причине неподходящей роли", async function () {

    });

    it("Должен произойти сбой в сжигании токена из за роли PEN но с другим node", async function () {

    });

    it("Должен сжечь свой токен", async function () {

    });

    it("Должен сжечь токен пользователь с ролью Commander", async function () {

    });

    it("Должен сжечь токен пользователь с ролью PEN", async function () {
    });

  });

});
