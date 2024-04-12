import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import {ethers} from "hardhat";

const VERV_INIT_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
const WAVE_INIT_DEFAULT: bigint = 750_000_000_000_000_000_000_000n;

const SOFT_DEFAULT: bigint = 15_000_000_000_000_000_000n;
const HARD_DEFAULT: bigint = 40_000_000_000_000_000_000n;


const PrivateSellModule = buildModule("PrivateSellModule", (m) => {

  const vrv = m.contract("VRVBeta", [VERV_INIT_DEFAULT]);

  const privateSell = m.contract(
      "PrivateSell", [vrv],
      {
        after: [vrv]
      }
  );

  m.call(vrv, 'transfer', [privateSell, VERV_INIT_DEFAULT]);
  m.call(privateSell, 'openSell', [SOFT_DEFAULT, HARD_DEFAULT, WAVE_INIT_DEFAULT]);


  return { privateSell };
});

export default PrivateSellModule;
