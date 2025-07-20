const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Розгортання IrysGameContract в Irys Testnet...");
  
  const IrysGameContract = await ethers.getContractFactory("IrysGameContract");
  const contract = await IrysGameContract.deploy();
  
  // Замінюємо contract.deployed() на waitForDeployment()
  await contract.waitForDeployment();
  
  // Використовуємо contract.target замість contract.address
  console.log("✅ Контракт розгорнуто за адресою:", contract.target);
  console.log("🔗 Irys Explorer:", `https://testnet-explorer.irys.xyz/address/${contract.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});