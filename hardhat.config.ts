import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

require("dotenv").config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    const balance = await ethers.provider.getBalance(account.address);

    console.log(account.address, ethers.formatEther(balance), "ETH");
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  // defender: {
    // apiKey: '57yrWobM1wUbu4D6VxK9sMsX5QuP2f5o',
    // apiSecret: '5obLLMXzFaUSbqdfdpFN3Q1jSygpVoK3fieA8jVwUbZecYLbvANABSjMQ8bgAQpp',
  // },
  networks: {
    // sepolia: {
      // url: "https://ethereum-sepolia.publicnode.com",
      // chainId: 11155111
    // },
    // hardhat: {
      // chainId: 31337,
    // },
  },
};

export default config;
