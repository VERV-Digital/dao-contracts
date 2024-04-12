import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VERV_INIT_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;

const VervModule = buildModule("VervModule", (m) => {
  const initSupply = m.getParameter("initSupply", VERV_INIT_DEFAULT);

  const vrv = m.contract("VRVBeta", [initSupply]);

  return { vrv };
});

export default VervModule;
