import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {ethers} from "hardhat";

const VERV_INIT_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
const WAVE_INIT_DEFAULT: bigint = 750_000_000_000_000_000_000_000n;

const SOFT_DEFAULT: bigint = 15_000_000_000_000_000_000n;
const HARD_DEFAULT: bigint = 40_000_000_000_000_000_000n;


const PrivateSaleModule = buildModule("PrivateSaleModule", (m) => {

  const vrv = m.contract("VRVBeta", [VERV_INIT_DEFAULT]);

  const privateSale = m.contract(
      "PrivateSale", [vrv],
      {
        after: [vrv]
      }
  );

  m.call(vrv, 'transfer', [privateSale, VERV_INIT_DEFAULT]);
  m.call(privateSale, 'openSale', [SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT]);


  return { privateSale };
});

export default PrivateSaleModule;
