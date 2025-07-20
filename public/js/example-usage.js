// Приклад використання Irys Network інтеграції
// Цей файл показує, як використовувати нову інтеграцію

// Глобальні змінні для прикладу
let irysIntegration = null;
let connectedWallet = null;
let walletAddress = null;

// Приклад ініціалізації
async function initializeExample() {
  console.log('🚀 Ініціалізація прикладу Irys Network інтеграції...');
  
  // Перевірка наявності гаманця
  if (typeof window.ethereum === 'undefined') {
    console.error('❌ MetaMask не встановлений');
    return false;
  }
  
  // Підключення гаманця
  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });
    
    if (accounts.length > 0) {
      connectedWallet = 'MetaMask';
      walletAddress = accounts[0];
      console.log('✅ Гаманець підключений:', walletAddress);
      
      // Ініціалізація інтеграції
      irysIntegration = window.IrysContractIntegration;
      const initialized = await irysIntegration.initialize(window.ethereum);
      
      if (initialized) {
        console.log('✅ Irys Network інтеграція ініціалізована');
        return true;
      } else {
        console.error('❌ Помилка ініціалізації інтеграції');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Помилка підключення гаманця:', error);
    return false;
  }
}

// Приклад початку гри
async function startGameExample(gameMode = 'endless') {
  console.log(`🎮 Початок гри в режимі: ${gameMode}`);
  
  if (!irysIntegration) {
    console.error('❌ Інтеграція не ініціалізована');
    return;
  }
  
  try {
    // Перевірка балансу Irys
    const balance = await irysIntegration.getIrysBalance(walletAddress);
    console.log('💰 Irys баланс:', balance);
    
    // Початок ігрової сесії
    const result = await irysIntegration.startGameSession(gameMode, walletAddress);
    
    if (result.success) {
      console.log('✅ Гра успішно почата!');
      console.log('Smart Contract TX:', result.smartContractTxHash);
      console.log('Irys Network TX:', result.irysTransactionId);
      console.log('Session ID:', result.sessionId);
      
      // Збереження сесії для подальшого використання
      window.currentGameSession = result.sessionId;
      window.currentIrysTransactionId = result.irysTransactionId;
      
      return result;
    } else {
      console.error('❌ Помилка початку гри:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Помилка:', error);
    return null;
  }
}

// Приклад оновлення рахунку під час гри
async function updateScoreExample(score) {
  console.log(`📊 Оновлення рахунку: ${score}`);
  
  if (!irysIntegration || !window.currentGameSession) {
    console.error('❌ Немає активної сесії');
    return;
  }
  
  try {
    const result = await irysIntegration.updateGameScore(
      window.currentGameSession, 
      score
    );
    
    if (result.success) {
      console.log('✅ Рахунок оновлено!');
      console.log('Transaction hash:', result.transactionHash);
    } else {
      console.error('❌ Помилка оновлення рахунку:', result.error);
    }
  } catch (error) {
    console.error('❌ Помилка:', error);
  }
}

// Приклад завершення гри
async function endGameExample(finalScore) {
  console.log(`🏁 Завершення гри з рахунком: ${finalScore}`);
  
  if (!irysIntegration || !window.currentGameSession) {
    console.error('❌ Немає активної сесії');
    return;
  }
  
  try {
    const result = await irysIntegration.endGameSession(
      window.currentGameSession,
      finalScore,
      walletAddress
    );
    
    if (result.success) {
      console.log('✅ Гра успішно завершена!');
      console.log('Smart Contract TX:', result.smartContractTxHash);
      console.log('Irys Network TX:', result.irysTransactionId);
      
      // Очищення сесії
      delete window.currentGameSession;
      delete window.currentIrysTransactionId;
      
      return result;
    } else {
      console.error('❌ Помилка завершення гри:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Помилка:', error);
    return null;
  }
}

// Приклад отримання статистики гравця
async function getPlayerStatsExample() {
  console.log('📊 Отримання статистики гравця...');
  
  if (!irysIntegration) {
    console.error('❌ Інтеграція не ініціалізована');
    return;
  }
  
  try {
    const stats = await irysIntegration.getPlayerStats(walletAddress);
    
    if (stats) {
      console.log('✅ Статистика гравця:');
      console.log('- Всього ігор:', stats.totalGames);
      console.log('- Загальний рахунок:', stats.totalScore);
      console.log('- Найкращий рахунок:', stats.highScore);
      console.log('- Середній рахунок:', stats.averageScore);
      
      return stats;
    } else {
      console.error('❌ Не вдалося отримати статистику');
      return null;
    }
  } catch (error) {
    console.error('❌ Помилка:', error);
    return null;
  }
}

// Приклад отримання статистики контракту
async function getContractStatsExample() {
  console.log('📈 Отримання статистики контракту...');
  
  if (!irysIntegration) {
    console.error('❌ Інтеграція не ініціалізована');
    return;
  }
  
  try {
    const stats = await irysIntegration.getContractStats();
    
    if (stats) {
      console.log('✅ Статистика контракту:');
      console.log('- Всього сесій:', stats.totalSessions);
      console.log('- Загальний обсяг:', stats.totalVolume, 'ETH');
      console.log('- Баланс контракту:', stats.contractBalance, 'ETH');
      console.log('- Комісія за сесію:', stats.gameSessionFee, 'ETH');
      
      return stats;
    } else {
      console.error('❌ Не вдалося отримати статистику контракту');
      return null;
    }
  } catch (error) {
    console.error('❌ Помилка:', error);
    return null;
  }
}

// Приклад повного циклу гри
async function fullGameExample() {
  console.log('🎮 Повний цикл гри...');
  
  // 1. Ініціалізація
  const initialized = await initializeExample();
  if (!initialized) {
    console.error('❌ Не вдалося ініціалізувати');
    return;
  }
  
  // 2. Початок гри
  const gameStart = await startGameExample('endless');
  if (!gameStart) {
    console.error('❌ Не вдалося почати гру');
    return;
  }
  
  // 3. Симуляція гри (оновлення рахунку)
  await updateScoreExample(100);
  await updateScoreExample(250);
  await updateScoreExample(500);
  
  // 4. Завершення гри
  const gameEnd = await endGameExample(750);
  if (!gameEnd) {
    console.error('❌ Не вдалося завершити гру');
    return;
  }
  
  // 5. Отримання статистики
  await getPlayerStatsExample();
  await getContractStatsExample();
  
  console.log('✅ Повний цикл гри завершено!');
}

// Приклад обробки помилок
async function errorHandlingExample() {
  console.log('⚠️ Приклад обробки помилок...');
  
  try {
    // Спроба використати неініціалізовану інтеграцію
    await irysIntegration.startGameSession('endless', walletAddress);
  } catch (error) {
    console.log('✅ Помилка правильно оброблена:', error.message);
  }
  
  try {
    // Спроба завершити неіснуючу сесію
    await irysIntegration.endGameSession('invalid_session', 100, walletAddress);
  } catch (error) {
    console.log('✅ Помилка правильно оброблена:', error.message);
  }
}

// Функція для тестування всіх прикладів
async function runAllExamples() {
  console.log('🧪 Запуск всіх прикладів...');
  
  // Тестування обробки помилок
  await errorHandlingExample();
  
  // Тестування повного циклу гри
  await fullGameExample();
  
  console.log('✅ Всі приклади завершено!');
}

// Експорт функцій для використання в консолі браузера
window.IrysExamples = {
  initialize: initializeExample,
  startGame: startGameExample,
  updateScore: updateScoreExample,
  endGame: endGameExample,
  getPlayerStats: getPlayerStatsExample,
  getContractStats: getContractStatsExample,
  fullGame: fullGameExample,
  errorHandling: errorHandlingExample,
  runAll: runAllExamples
};

console.log('📚 Приклади Irys Network інтеграції завантажено!');
console.log('Використовуйте window.IrysExamples для тестування'); 