import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "dotenv/config";

import "./tasks/accounts";
import "./tasks/generateBid";

import {
  EtherscanAPIKey,
  PrivateKey,
  SepoliaRPCUrl
} from "./utils/env";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    sepolia: {
      url: SepoliaRPCUrl || "",
      accounts: [PrivateKey || ""],
      chainId: 11155111,
      gasPrice: 5 * 1000000000
    }
  },
  etherscan: {
    apiKey: EtherscanAPIKey || ""
  },
  sourcify: {
    // Disabled by default
    // Doesn't need an API key
    // enabled: true
  },
  mocha: {
    bail: true,
    timeout: 300000
  },
  gasReporter: {
    currency: "USD"
  }
};

export default config;
