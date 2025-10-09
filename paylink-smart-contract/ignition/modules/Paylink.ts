import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PaylinkModule", (m) => {
  const paylink = m.contract("Paylink");

  return { paylink };
});
