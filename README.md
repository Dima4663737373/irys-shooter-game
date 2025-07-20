# Irys Shooter Game - Irys Network Integration

## Опис

Irys Shooter - це гра Bubble Shooter з інтеграцією Irys Network та смарт-контрактами. Гра використовує Irys Network для зберігання ігрових даних та смарт-контракт для обробки транзакцій.

## Особливості

- 🎮 Класична гра Bubble Shooter
- 🔗 Інтеграція з Irys Network для зберігання даних
- 📜 Смарт-контракт для обробки транзакцій
- 💰 Різні режими гри з різними комісіями
- 🏆 Система лідерборду
- 📊 Статистика гравців на блокчейні

## Технології

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Blockchain**: Irys Network (Devnet/Mainnet)
- **Smart Contract**: Solidity (Ethereum)
- **Wallet Integration**: MetaMask, OKX Wallet, Rabby Wallet

## Встановлення та запуск

### 1. Клонування репозиторію

```bash
git clone <repository-url>
cd irys-shooter-game
```

### 2. Встановлення залежностей

```bash
npm install
```

### 3. Розгортання смарт-контракту

1. Відкрийте [Remix IDE](https://remix.ethereum.org/)
2. Завантажте файл `contracts/IrysGameContract.sol`
3. Скомпілюйте контракт
4. Розгорніть на Irys Network (Devnet або Mainnet)
5. Скопіюйте адресу контракту

### 4. Налаштування контракту

Відредагуйте файл `irys-contract-integration.js`:

```javascript
const IRYS_CONFIG = {
  network: "devnet", // або "mainnet" для продакшену
  token: "ethereum",
  contractAddress: "0x...", // Вставте адресу вашого розгорнутого контракту
};
```

### 5. Запуск локального сервера

```bash
npm run dev
# або
python -m http.server 8000
```

Відкрийте браузер та перейдіть на `http://localhost:8000`

## Структура проекту

```
src/
├── contracts/
│   └── IrysGameContract.sol          # Смарт-контракт
├── game/
│   └── bubbleShooter.js              # Логіка гри
├── styles/
│   └── style.css                     # Стилі
├── irys-contract-integration.js      # Інтеграція Irys + Smart Contract
├── main.js                          # Головна логіка додатку
├── index.html                       # Головна сторінка
└── README.md                        # Документація
```

## Інтеграція з Irys Network

### Процес транзакції

1. **Початок гри**:
   - Користувач вибирає режим гри
   - Показується модальне вікно з деталями транзакції
   - Дані гри завантажуються на Irys Network
   - Створюється транзакція в смарт-контракті
   - Гра починається

2. **Завершення гри**:
   - Результат гри зберігається локально
   - Дані про завершення завантажуються на Irys Network
   - Смарт-контракт оновлює статистику гравця

### Структура даних на Irys Network

```json
{
  "gameMode": "endless",
  "playerAddress": "0x...",
  "sessionId": "session_...",
  "timestamp": 1234567890,
  "action": "startGame",
  "version": "2.0.0"
}
```

## Смарт-контракт функції

### Основні функції

- `startGameSession(sessionId, gameMode, irysTransactionId)` - Початок ігрової сесії
- `endGameSession(sessionId, score, irysTransactionId)` - Завершення ігрової сесії
- `updateGameScore(sessionId, score)` - Оновлення рахунку під час гри
- `getPlayerStats(playerAddress)` - Отримання статистики гравця

### Комісії за режими гри

- **Endless**: 0.0001 ETH
- **Timed**: 0.00015 ETH  
- **Challenge**: 0.0002 ETH

## Налаштування гаманців

### Підтримувані гаманці

- **MetaMask**: Автоматична підтримка
- **OKX Wallet**: Автоматична підтримка
- **Rabby Wallet**: Автоматична підтримка

### Налаштування мережі

Гра автоматично підключається до Irys Network. Для тестування використовується Devnet, для продакшену - Mainnet.

## Розробка

### Додавання нових режимів гри

1. Оновіть смарт-контракт:
```solidity
gameModeFees["newMode"] = 0.00025 ether;
```

2. Додайте логіку в `main.js`:
```javascript
// Додайте новий режим в меню
```

### Додавання нових гаманців

1. Оновіть `js/wallet.js`:
```javascript
case 'newWallet':
  if (typeof window.newWallet !== 'undefined') {
    provider = window.newWallet;
    walletName = 'New Wallet';
  }
```

## Вирішення проблем

### Помилка "Irys SDK not available"

- Перевірте підключення до інтернету
- Перезавантажте сторінку
- Перевірте консоль браузера на помилки

### Помилка "Transaction failed"

- Перевірте баланс гаманця
- Переконайтеся, що гаманець підключений до правильної мережі
- Перевірте налаштування смарт-контракту

### Помилка "Contract not initialized"

- Перевірте адресу контракту в `irys-contract-integration.js`
- Переконайтеся, що контракт розгорнутий
- Перевірте ABI контракту

## Ліцензія

MIT License

## Підтримка

Для підтримки звертайтеся до:
- GitHub Issues
- Email: support@example.com

## Внесок

1. Форкніть репозиторій
2. Створіть гілку для нової функції
3. Зробіть коміт змін
4. Створіть Pull Request

## Версії

- **v2.0.0**: Інтеграція з Irys Network
- **v1.0.0**: Базова версія гри 