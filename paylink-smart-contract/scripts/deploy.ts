import hre from "hardhat";
import PaylinkModule from "../ignition/modules/Paylink.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connection = await hre.network.connect();
  const { paylink } = await connection.ignition.deploy(PaylinkModule);

  const address = paylink.address;
  const abi = paylink.abi;

  const outputDirs = [
    path.join(__dirname, "../../paylink-frontend/libs"),
    path.join(__dirname, "../../paylink-backend/src/lib"),
  ];

  const fileContents = `
  export const CONTRACT_ADDRESS = ${JSON.stringify(address)};
  export const CONTRACT_ABI = ${JSON.stringify(abi, null, 2)};
  `;

  // Write to all directories
  for (const outDir of outputDirs) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "contract.ts");

    fs.writeFileSync(outPath, fileContents, { encoding: "utf-8" });
    console.log(`✅ Wrote ABI & address to ${outPath}`);
  }

  console.log(`\n🎉 Deployment complete!`);
  console.log(`Contract address: ${address}`);
}
main().catch(console.error);
