import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import {
  EtherscanAPIKey,
  GoerliRPCUrl,
  PrivateKey,
  SepoliaRPCUrl
} from "./utils/env";

// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
//   const accounts = await hre.ethers.getSigners();
//
//   for (const account of accounts) {
//     const balance = await ethers.provider.getBalance(account.address);
//
//     console.log(account.address, ethers.formatEther(balance), "ETH");
//   }
// });

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
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    // goerli: {
    //   url: GoerliRPCUrl || "",
    //   accounts: [PrivateKey],
    //   chainId: 5,
    //   gasPrice: 300 * 1000000000
    // },
    // sepolia: {
    //   url: SepoliaRPCUrl || "",
    //   accounts: [PrivateKey],
    //   chainId: 11155111,
    //   gasPrice: 5 * 1000000000
    // }
  },
  etherscan: {
    apiKey: EtherscanAPIKey
  },
  mocha: {
    bail: true,
    timeout: 300000
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  }
};

export default config;
