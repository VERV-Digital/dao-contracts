import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VERV_INIT_SYPPLY_DEFAULT: bigint = 7_500_000_000_000_000_000_000_000n;
const VERV_REWARDS_AT_DEFAULT: number = Math.round(Date.now() / 1000) + (60 * 60 * 24 * 30); // + 30 days

const VervModule = buildModule("OnlyVervCoin", (m) => {
  const initSupply = m.getParameter("initSupply", VERV_INIT_SYPPLY_DEFAULT);
  const rewardsAt = m.getParameter("rewardsAt", VERV_REWARDS_AT_DEFAULT);

  const vrv = m.contract("VRVBeta", [initSupply, rewardsAt]);

  return { vrv };
});

export default VervModule;
