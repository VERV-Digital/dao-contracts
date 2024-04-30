import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {ethers} from "hardhat";

const VERV_INIT_SYPPLY_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
const VERV_REWARDS_AT_DEFAULT: number = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 30); // + 30 days
const WAVE_INIT_DEFAULT: bigint = 750_000_000_000_000_000_000_000n;

const SOFT_DEFAULT: bigint = 30_000_000_000_000_000_000n;
const HARD_DEFAULT: bigint = 150_000_000_000_000_000_000n;


const PrivateSaleModule = buildModule("PrivateSaleModule", (m) => {

  const vrv = m.contract("VRVBeta", [VERV_INIT_SYPPLY_DEFAULT, VERV_REWARDS_AT_DEFAULT]);

  const privateSale = m.contract(
      "PrivateSale", [vrv],
      {
        after: [vrv]
      }
  );

  const closeAt = m.getParameter("closeAt", Math.round(Date.now() / 1000) + (60 * 60 * 24 * 12));

  m.call(vrv, 'transfer', [privateSale, VERV_INIT_SYPPLY_DEFAULT]);
  m.call(privateSale, 'openSale', [SOFT_DEFAULT, HARD_DEFAULT, 10, WAVE_INIT_DEFAULT, closeAt]);

  return { privateSale };
});

export default PrivateSaleModule;
