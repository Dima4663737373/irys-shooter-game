const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Розгортання GameContract для лідерборда...");
  
  // Отримуємо фабрику контракту
  const GameContract = await ethers.getContractFactory("GameContract");
  
  // Деплоймо контракт
  console.log("📦 Деплой контракту...");
  const contract = await GameContract.deploy();
  
  // Чекаємо завершення деплою
  await contract.waitForDeployment();
  
  const contractAddress = contract.target;
  
  console.log("✅ GameContract розгорнуто за адресою:", contractAddress);
  console.log("🔗 Sepolia Explorer:", `https://sepolia.etherscan.io/address/${contractAddress}`);
  
  // Збереження адреси для подальшого використання
  console.log("\n📋 Скопіюйте цю адресу для інтеграції:");
  console.log(`CONTRACT_ADDRESS = "${contractAddress}";`);
  
  // Тестування базових функцій
  console.log("\n🧪 Тестування контракту...");
  
  try {
    const totalPlayers = await contract.getTotalPlayers();
    console.log("👥 Загальна кількість гравців:", totalPlayers.toString());
    
    console.log("✅ Контракт працює коректно!");
  } catch (error) {
    console.error("❌ Помилка тестування:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Помилка деплою:", error);
  process.exitCode = 1;
});