import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INIT_DEFAULT: bigint = 1_000_000_000_000_000_000n;

const VervModule = buildModule("VervModule", (m) => {
  const initSupply = m.getParameter("initSupply", INIT_DEFAULT);

  const vrv = m.contract("VRVBeta", [initSupply]);

  return { vrv };
});

export default VervModule;
