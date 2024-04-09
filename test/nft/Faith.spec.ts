import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { VRVBeta } from "../../typechain-types";


describe("ER721 Faith Token", function () {

    beforeEach(async function () {

    });

    describe("Deployment", function () {

        it("Должен проверить владельца контракта", async function () {
        });

        it("Должен проверить адреса контактов", async function () {
        });

    });

    describe("Change VRV Token address", function () {

        it("Должен установить VRV Token и проверить что он установлен", async function () {
        });


        it("Должен проверить сменить адрес VRV Token и проверить что он сменился", async function () {
        });

    });

    describe("Minting", function () {

        it("Должен произойти сбой в чеканке по причине отсутствия токенов", async function () {
        });

        it("Должен произойти сбой в чеканке по причине превышения максимального количества токенов", async function () {
        });

        it("Должен отчеканить токен", async function () {
        });

    });

    describe("Get detail", function () {

        it("Должен произойти сбой в получении размера голоса из за отсутствия токена", async function () {
        });

        it("Должен получить размер голоса", async function () {
        });

        it("Должен произойти сбой в получении tokenURI из за отсутствия токена", async function () {
        });

        it("Должен получить адрес tokenURI", async function () {
        });

        it("Должен произойти сбой в получении детальной информации из за отсутствия токена", async function () {
        });

        it("Должен получить детальную информацию", async function () {
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

    describe("Change VRV Token address", function () {

        it("Должен произойти сбой в смене VRV Toke по причине недостатка прав", async function () {
        });

        it("Должен установить VRV Token и проверить что он установлен", async function () {
        });


        it("Должен проверить сменить адрес VRV Token и проверить что он сменился", async function () {
        });

    });

});
