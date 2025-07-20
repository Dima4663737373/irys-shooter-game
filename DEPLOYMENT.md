# Інструкції по розгортанню IrysGameContract

## Передумови

1. **MetaMask** або інший Web3 гаманець
2. **Ethereum тестнет токени** (для тестування)
3. **Remix IDE** або **Hardhat** для розгортання

## Крок 1: Підготовка середовища

### Встановлення залежностей (якщо використовуєте Hardhat)

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Налаштування Hardhat (опціонально)

Створіть `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    irysDevnet: {
      url: "https://devnet.irys.xyz",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1337
    },
    irysMainnet: {
      url: "https://mainnet.irys.xyz", 
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1
    }
  }
};
```

## Крок 2: Розгортання через Remix IDE

### 1. Відкрийте Remix IDE
Перейдіть на [remix.ethereum.org](https://remix.ethereum.org)

### 2. Завантажте контракт
- Створіть новий файл `IrysGameContract.sol`
- Скопіюйте код з `contracts/IrysGameContract.sol`

### 3. Скомпілюйте контракт
- Перейдіть на вкладку "Solidity Compiler"
- Виберіть версію Solidity 0.8.19
- Натисніть "Compile IrysGameContract.sol"

### 4. Розгорніть контракт
- Перейдіть на вкладку "Deploy & Run Transactions"
- Виберіть середовище "Injected Provider - MetaMask"
- Підключіть гаманець
- Натисніть "Deploy"

### 5. Запишіть адресу контракту
Скопіюйте адресу розгорнутого контракту для подальшого використання.

## Крок 3: Налаштування фронтенду

### 1. Оновіть конфігурацію

Відредагуйте `irys-contract-integration.js`:

```javascript
const IRYS_CONFIG = {
  network: "devnet", // або "mainnet"
  token: "ethereum",
  contractAddress: "0x...", // Вставте вашу адресу контракту
};
```

### 2. Перевірте ABI

Переконайтеся, що ABI в `irys-contract-integration.js` відповідає вашому контракту.

## Крок 4: Тестування

### 1. Запустіть локальний сервер

```bash
npm run dev
# або
python -m http.server 8000
```

### 2. Підключіть гаманець

- Відкрийте браузер
- Перейдіть на `http://localhost:8000`
- Підключіть MetaMask або інший гаманець

### 3. Протестуйте функції

- Спробуйте почати гру
- Перевірте транзакції в гаманці
- Перевірте дані на Irys Network

## Крок 5: Перевірка контракту

### 1. Перевірте на Irys Explorer

- Перейдіть на [devnet.irys.xyz](https://devnet.irys.xyz) (для devnet)
- Знайдіть ваш контракт за адресою
- Перевірте транзакції

### 2. Перевірте функції

Використовуйте Remix або Irys Explorer для тестування:

```javascript
// Отримати комісію за режим гри
await contract.getGameModeFee("endless")

// Отримати статистику контракту
await contract.getContractStats()

// Отримати статистику гравця
await contract.getPlayerStats("0x...")
```

## Крок 6: Продакшн розгортання

### 1. Підготовка

- Переконайтеся, що код протестований
- Отримайте реальні ETH для комісій
- Налаштуйте моніторинг

### 2. Розгортання на Mainnet

```javascript
const IRYS_CONFIG = {
  network: "mainnet",
  token: "ethereum", 
  contractAddress: "0x...", // Mainnet адреса
};
```

### 3. Перевірка безпеки

- Аудит коду
- Тестування на тестнеті
- Перевірка всіх функцій

## Структура транзакцій

### Початок гри

1. **Irys Network транзакція**:
   - Завантаження ігрових даних
   - Отримання transaction ID

2. **Smart Contract транзакція**:
   - Виклик `startGameSession()`
   - Передача Irys transaction ID
   - Сплата комісії

### Завершення гри

1. **Irys Network транзакція**:
   - Завантаження результатів гри
   - Отримання transaction ID

2. **Smart Contract транзакція**:
   - Виклик `endGameSession()`
   - Передача Irys transaction ID
   - Оновлення статистики

## Моніторинг та підтримка

### Логи

Перевіряйте консоль браузера для логів:

```javascript
console.log('Smart Contract TX:', result.smartContractTxHash);
console.log('Irys Network TX:', result.irysTransactionId);
```

### Помилки

Найпоширеніші помилки:

1. **"Insufficient fee"** - Недостатньо ETH для комісії
2. **"Session already exists"** - Сесія вже існує
3. **"Only session owner"** - Неправильний власник сесії

### Оновлення

Для оновлення контракту:

1. Розгорніть нову версію
2. Оновіть адресу в конфігурації
3. Мігруйте дані (якщо потрібно)

## Безпека

### Рекомендації

- Використовуйте multi-sig гаманець для власника контракту
- Регулярно перевіряйте баланс контракту
- Моніторте підозрілі транзакції
- Оновлюйте залежності

### Аварійні процедури

```solidity
// Екстрена зупинка
function emergencyPause() external onlyOwner {
    // Логіка зупинки
}
```

## Контакти

Для підтримки:
- GitHub Issues
- Email: support@example.com
- Discord: #irys-support 