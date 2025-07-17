import { BubbleShooterGame } from './game/bubbleShooter.js';

const app = document.getElementById('app');

// Р“Р»РѕР±Р°Р»СЊРЅР° С„СѓРЅРєС†С–СЏ РґР»СЏ Р·Р±РµСЂРµР¶РµРЅРЅСЏ СЂРµР·СѓР»СЊС‚Р°С‚С–РІ РІ Р»С–РґРµСЂР±РѕСЂРґ
function saveToLeaderboard(score, gameMode = 'endless') {
  console.log(`рџЏ† saveToLeaderboard Р’РРљР›РРљРђРќРђ: score=${score}, gameMode=${gameMode}`);

  const playerName = localStorage.getItem('playerName') || 'Anonymous';
  console.log(`рџ‘¤ Р†Рј'СЏ РіСЂР°РІС†СЏ: ${playerName}`);

  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  console.log(`рџ“Љ РџРѕС‚РѕС‡РЅРёР№ Р»С–РґРµСЂР±РѕСЂРґ РјР°С” ${leaderboard.length} Р·Р°РїРёСЃС–РІ`);

  // Р”РѕРґР°С”РјРѕ РЅРѕРІРёР№ СЂРµР·СѓР»СЊС‚Р°С‚
  const newResult = {
    name: playerName,
    score: score,
    mode: gameMode || 'endless', // Р—Р°Р±РµР·РїРµС‡СѓС”РјРѕ С‰Рѕ СЂРµР¶РёРј Р·Р°РІР¶РґРё РІРёР·РЅР°С‡РµРЅРёР№
    date: new Date().toISOString()
  };
  console.log(`вћ• Р”РѕРґР°С”РјРѕ РЅРѕРІРёР№ СЂРµР·СѓР»СЊС‚Р°С‚:`, newResult);

  leaderboard.push(newResult);

  // РЎРѕСЂС‚СѓС”РјРѕ Р·Р° СЂРµР·СѓР»СЊС‚Р°С‚РѕРј (РЅР°Р№РєСЂР°С‰С– РїРµСЂС€С–)
  leaderboard.sort((a, b) => b.score - a.score);

  // Р—Р±С–Р»СЊС€СѓС”РјРѕ РґРѕ С‚РѕРї-50 СЂРµР·СѓР»СЊС‚Р°С‚С–РІ РґР»СЏ РјРѕР¶Р»РёРІРѕСЃС‚С– СЃРєСЂРѕР»Сѓ
  const topResults = leaderboard.slice(0, 50);

  // Р—Р±РµСЂС–РіР°С”РјРѕ РЅР°Р·Р°Рґ РІ localStorage
  localStorage.setItem('bubbleLeaderboard', JSON.stringify(topResults));
  console.log(`рџ’ѕ Р РµР·СѓР»СЊС‚Р°С‚ Р·Р±РµСЂРµР¶РµРЅРѕ! РўРµРїРµСЂ РІ Р»С–РґРµСЂР±РѕСЂРґС– ${topResults.length} Р·Р°РїРёСЃС–РІ`);
  console.log(`рџ“‹ РўРѕРї-3 СЂРµР·СѓР»СЊС‚Р°С‚Рё:`, topResults.slice(0, 3));
}

// Р•РєСЃРїРѕСЂС‚СѓС”РјРѕ С„СѓРЅРєС†С–С— РґР»СЏ РІРёРєРѕСЂРёСЃС‚Р°РЅРЅСЏ РІ РіСЂС–
window.saveToLeaderboard = saveToLeaderboard;
window.setGlobalBackground = setGlobalBackground;

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РІСЃС‚Р°РЅРѕРІР»РµРЅРЅСЏ С„РѕРЅСѓ (СЃРїСЂРѕС‰РµРЅР°)
function setGlobalBackground() {
  // РџСЂРѕСЃС‚Рѕ РїРµСЂРµРєРѕРЅСѓС”РјРѕСЃСЏ С‰Рѕ CSS РїСЂР°С†СЋС” РїСЂР°РІРёР»СЊРЅРѕ
  document.body.style.background = "url('/menu-bg.jpg') center center / cover no-repeat fixed";
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ С€РІРёРґРєРёС… РїРµСЂРµС…РѕРґС–РІ Р±РµР· Р·Р°С‚СЂРёРјРѕРє
function smoothTransition(newContent) {
  const app = document.getElementById('app');

  // РњРёС‚С‚С”РІР° Р·Р°РјС–РЅР° РєРѕРЅС‚РµРЅС‚Сѓ Р±РµР· Р±СѓРґСЊ-СЏРєРёС… РµС„РµРєС‚С–РІ
  app.style.transition = 'none';
  app.style.opacity = '1';
  app.innerHTML = newContent;
}

function showMainMenu() {
  setGlobalBackground();
  const content = `
    <div class="main-menu" style="
      min-height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4);">
      <h1 style="
        animation: bounceIn 1s ease-out;
        background: rgba(255,255,255,0.85);
        backdrop-filter: blur(10px);
        border: 2px solid #43cea2;
        border-radius: 18px;
        box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2);
        padding: 24px 36px;
        margin: 0 0 32px 0;
        color: #2193b0;
        font-size: 2.5rem;
        font-weight: bold;
        letter-spacing: 1px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">рџЋЇ Irys Shooter</h1>
      
      <div class="buttons-container" style="
        background: rgba(255,255,255,0.1);
        backdrop-filter: blur(15px);
        border: 3px solid rgba(255,255,255,0.8);
        border-radius: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 10px 30px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.5);
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        animation: slideInUp 0.8s ease-out 0.2s both;
        transition: all 0.3s ease-in-out;
        cursor: default;
      " onmouseover="this.style.borderColor='rgba(255,255,255,1)'; this.style.boxShadow='0 25px 70px rgba(0,0,0,0.5), 0 15px 40px rgba(255,255,255,0.2), inset 0 2px 0 rgba(255,255,255,0.7)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.8)'; this.style.boxShadow='0 20px 60px rgba(0,0,0,0.4), 0 10px 30px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.5)'; this.style.transform='translateY(0)'">
      <button id="play-btn" style="animation: slideInLeft 0.6s ease-out 0.3s both;">рџЋ® Play</button>
      <button id="connect-wallet-btn" style="animation: slideInUp 0.6s ease-out 0.4s both;">рџ”— Connect Wallet</button>
      <button id="leaderboard-btn" style="animation: slideInUp 0.6s ease-out 0.5s both;">рџЏ† Leaderboard</button>
      <button id="settings-btn" style="animation: slideInRight 0.6s ease-out 0.7s both;">вљ™пёЏ Settings</button>
      </div>
    </div>
  `;

  smoothTransition(content);

  // Р”РѕРґР°С”РјРѕ event listeners РІС–РґСЂР°Р·Сѓ Р±РµР· Р·Р°С‚СЂРёРјРєРё
  // Р”РѕРґР°С”РјРѕ Р·РІСѓРєРѕРІС– РµС„РµРєС‚Рё РґР»СЏ РєРЅРѕРїРѕРє
  const buttons = document.querySelectorAll('.main-menu button');
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      console.log('Menu button hovered - playing sound');
      // РџСЂРѕСЃС‚РёР№ Р·РІСѓРє hover
      if (window.AudioContext || window.webkitAudioContext) {
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime); // Р—Р±С–Р»СЊС€СѓС”РјРѕ РіСѓС‡РЅС–СЃС‚СЊ
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
          console.log('Menu hover sound played');
        } catch (e) {
          console.warn('Error playing menu sound:', e);
        }
      } else {
        console.warn('AudioContext not supported');
      }
    });
  });

  document.getElementById('play-btn').onclick = () => showGame();
  document.getElementById('connect-wallet-btn').onclick = () => showWalletConnection();
  document.getElementById('leaderboard-btn').onclick = () => showLeaderboard();
  document.getElementById('settings-btn').onclick = () => showSettings();

  // РўРµСЃС‚РѕРІР° РєРЅРѕРїРєР° РґР»СЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РІС–РєРЅР° (С‚РёРјС‡Р°СЃРѕРІРѕ)
  const testBtn = document.createElement('button');
  testBtn.textContent = 'рџ§Є Test Modal';
  testBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #ff6b6b; color: white; border: none; border-radius: 5px; cursor: pointer;';
  testBtn.onclick = () => {
    console.log('рџ§Є Testing transaction modal...');
    // Р’СЃС‚Р°РЅРѕРІР»СЋС”РјРѕ С‚РµСЃС‚РѕРІС– РґР°РЅС–
    window.connectedWallet = 'Test Wallet';
    window.walletAddress = '0x1234567890123456789012345678901234567890';

    showTransactionModal('endless', () => {
      console.log('рџ§Є Test transaction confirmed');
      hideTransactionModal();
    });
  };
  document.body.appendChild(testBtn);
}

function showGame() {
  console.log('showGame: Starting game initialization');

  // РџРµСЂРµРІС–СЂСЏС”РјРѕ, С‡Рё РїС–РґРєР»СЋС‡РµРЅРёР№ РіР°РјР°РЅРµС†СЊ
  if (!connectedWallet || !walletAddress) {
    alert('Please connect your wallet first to play!');
    showMainMenu();
    return;
  }

  // Р—Р±РµСЂС–РіР°С”РјРѕ С„РѕРЅ РїС–Рґ С‡Р°СЃ РіСЂРё
  setGlobalBackground();

  const content = `
    <div class="game-container">
      <canvas id="gameCanvas"></canvas>
    </div>
  `;

  smoothTransition(content);

  console.log('showGame: HTML created, canvas element:', document.getElementById('gameCanvas'));

  window.showMainMenu = showMainMenu;

  // Р†РЅС–С†С–Р°Р»С–Р·СѓС”РјРѕ РіСЂСѓ РІС–РґСЂР°Р·Сѓ Р±РµР· Р·Р°С‚СЂРёРјРєРё
  try {
    const gameContainer = document.querySelector('.game-container');
    console.log('showGame: Game container found:', gameContainer);

    const game = new BubbleShooterGame(gameContainer);
    console.log('showGame: Game instance created:', game);

    // РњРѕРґРёС„С–РєСѓС”РјРѕ showModeSelection РґР»СЏ С–РЅС‚РµРіСЂР°С†С–С— Р· Irys
    const originalShowModeSelection = game.showModeSelection.bind(game);
    game.showModeSelection = function () {
      originalShowModeSelection();

      // Р”РѕРґР°С”РјРѕ РѕР±СЂРѕР±РЅРёРєРё РґР»СЏ РєРЅРѕРїРѕРє СЂРµР¶РёРјС–РІ Р· Irys С‚СЂР°РЅР·Р°РєС†С–СЏРјРё
      setTimeout(() => {
        const endlessBtn = document.getElementById('endless-mode');
        const timedBtn = document.getElementById('timed-mode');

        if (endlessBtn) {
          endlessBtn.onclick = () => startGameWithTransaction('endless', game);
        }

        if (timedBtn) {
          timedBtn.onclick = () => startGameWithTransaction('timed', game);
        }
      }, 100);
    };

    // Р—Р°РїСѓСЃРєР°С”РјРѕ РІРёР±С–СЂ СЂРµР¶РёРјСѓ РіСЂРё
    game.showModeSelection();
    console.log('showGame: Mode selection started');

    // РџРµСЂРµРєРѕРЅСѓС”РјРѕСЃСЏ С‰Рѕ С„РѕРЅ РІСЃС‚Р°РЅРѕРІР»РµРЅРёР№
    setGlobalBackground();
  } catch (error) {
    console.error('showGame: Error creating game:', error);
  }
}

function showLeaderboard() {
  // Р—Р±РµСЂС–РіР°С”РјРѕ С„РѕРЅ РІ Р»С–РґРµСЂР±РѕСЂРґС–
  setGlobalBackground();

  const leaderboard = JSON.parse(localStorage.getItem('bubbleLeaderboard') || '[]');
  const currentPlayerName = localStorage.getItem('playerName') || 'Anonymous';

  // Р—РЅР°С…РѕРґРёРјРѕ РЅР°Р№РєСЂР°С‰РёР№ СЂРµР·СѓР»СЊС‚Р°С‚ РїРѕС‚РѕС‡РЅРѕРіРѕ РіСЂР°РІС†СЏ
  const playerResults = leaderboard.filter(entry => entry.name === currentPlayerName);
  const bestPlayerResult = playerResults.length > 0 ?
    playerResults.reduce((best, current) => current.score > best.score ? current : best) : null;

  // Р—РЅР°С…РѕРґРёРјРѕ РїРѕР·РёС†С–СЋ РЅР°Р№РєСЂР°С‰РѕРіРѕ СЂРµР·СѓР»СЊС‚Р°С‚Сѓ РіСЂР°РІС†СЏ РІ Р·Р°РіР°Р»СЊРЅРѕРјСѓ СЂРµР№С‚РёРЅРіСѓ
  let playerPosition = null;
  if (bestPlayerResult) {
    playerPosition = leaderboard.findIndex(entry =>
      entry.name === bestPlayerResult.name &&
      entry.score === bestPlayerResult.score &&
      entry.mode === bestPlayerResult.mode
    ) + 1;
  }

  // РЎС‚РІРѕСЂСЋС”РјРѕ Р±Р»РѕРє Р· РЅР°Р№РєСЂР°С‰РёРј СЂРµР·СѓР»СЊС‚Р°С‚РѕРј РіСЂР°РІС†СЏ
  let playerBestSection = '';
  if (bestPlayerResult) {
    playerBestSection = `
      <div style="background:linear-gradient(135deg, #43cea2 0%, #185a9d 100%); border-radius:12px; padding:16px; margin:16px 0; box-shadow:0 8px 24px rgba(67,206,162,0.3); border:2px solid rgba(255,255,255,0.2);">
        <h3 style="color:#fff; margin:0 0 12px 0; font-size:1.2rem; text-shadow:0 2px 4px rgba(0,0,0,0.3);">рџЊџ Your Best Result</h3>
        <div style="background:rgba(255,255,255,0.15); border-radius:8px; padding:12px; backdrop-filter:blur(10px);">
          <div style="display:flex; justify-content:space-between; align-items:center; color:#fff; font-weight:bold;">
            <span style="font-size:1.1rem;">Rank #${playerPosition}</span>
            <span style="font-size:1.3rem; color:#FFD700; text-shadow:0 2px 4px rgba(0,0,0,0.5);">${bestPlayerResult.score} pts</span>
            <span style="font-size:1rem; opacity:0.9;">${bestPlayerResult.mode === 'timed' ? '1min' : 'Endless'}</span>
          </div>
        </div>
      </div>
    `;
  } else {
    playerBestSection = `
      <div style="background:linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); border-radius:12px; padding:16px; margin:16px 0; box-shadow:0 8px 24px rgba(149,165,166,0.3); border:2px solid rgba(255,255,255,0.2);">
        <h3 style="color:#fff; margin:0 0 8px 0; font-size:1.2rem; text-shadow:0 2px 4px rgba(0,0,0,0.3);">рџЋ® Your Results</h3>
        <p style="color:rgba(255,255,255,0.9); margin:0; font-size:1rem;">No games played yet. Start playing to see your best score!</p>
      </div>
    `;
  }

  // РЎС‚РІРѕСЂСЋС”РјРѕ СЂСЏРґРєРё С‚Р°Р±Р»РёС†С– Р· РІРёРґС–Р»РµРЅРЅСЏРј СЂРµР·СѓР»СЊС‚Р°С‚С–РІ РїРѕС‚РѕС‡РЅРѕРіРѕ РіСЂР°РІС†СЏ
  let tableRows = leaderboard.map((entry, idx) => {
    const isCurrentPlayer = entry.name === currentPlayerName;
    const rowStyle = isCurrentPlayer ?
      'border-bottom:1px solid #e0e6ed; background:linear-gradient(90deg, rgba(67,206,162,0.1) 0%, rgba(24,90,157,0.1) 100%); border-left:4px solid #43cea2;' :
      'border-bottom:1px solid #e0e6ed;';

    const nameStyle = isCurrentPlayer ?
      'padding:12px 16px; text-align:left; color:#185a9d; font-weight:bold;' :
      'padding:12px 16px; text-align:left; color:#333;';

    return `
      <tr style="${rowStyle}">
        <td style="padding:12px 8px; text-align:center; font-weight:bold; color:#2193b0;">${idx + 1}</td>
        <td style="${nameStyle}">${entry.name}${isCurrentPlayer ? ' рџ‘¤' : ''}</td>
        <td style="padding:12px 16px; text-align:center; font-weight:bold; color:#43cea2;">${entry.score}</td>
        <td style="padding:12px 16px; text-align:center; color:#666;">${entry.mode === 'timed' ? '1min' : 'Endless'}</td>
      </tr>
    `;
  }).join('');

  if (!tableRows) {
    tableRows = '<tr><td colspan="4" style="padding:20px; text-align:center; color:#999; font-style:italic;">No results yet</td></tr>';
  }

  // РџРѕРєР°Р·СѓС”РјРѕ РєС–Р»СЊРєС–СЃС‚СЊ Р·Р°РїРёСЃС–РІ
  const recordsCount = leaderboard.length;
  const recordsInfo = recordsCount > 10 ?
    `<p style="color:#666; font-size:0.9rem; margin-bottom:16px;">Showing ${recordsCount} results - scroll to see more</p>` :
    recordsCount > 0 ? `<p style="color:#666; font-size:0.9rem; margin-bottom:16px;">${recordsCount} result${recordsCount > 1 ? 's' : ''}</p>` : '';

  const content = `
    <div class="leaderboard" style="background:#ffffff; border:2px solid #43cea2; border-radius:18px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:36px 32px; text-align:center; max-width:580px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#111; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">рџЏ† Leaderboard</h2>
      
      ${playerBestSection}
      
      ${recordsInfo}
      <div style="max-height:400px; overflow-y:auto; border:1px solid #e0e6ed; border-radius:8px; margin:16px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:1.1rem;">
          <thead style="position:sticky; top:0; background:#e3f6fd; z-index:1;">
            <tr style="color:#2193b0;">
              <th style="padding:12px 8px; text-align:center; border-bottom:2px solid #43cea2;">#</th>
              <th style="padding:12px 16px; text-align:left; border-bottom:2px solid #43cea2;">Name</th>
              <th style="padding:12px 16px; text-align:center; border-bottom:2px solid #43cea2;">Score</th>
              <th style="padding:12px 16px; text-align:center; border-bottom:2px solid #43cea2;">Mode</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      </div>
      <button id="admin-clear" style="margin-bottom:16px; width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#e74c3c 0%,#c0392b 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(231,76,60,0.10);">Admin Clear</button><br>
      <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
    </div>
  `;
  smoothTransition(content);

  // Р”РѕРґР°С”РјРѕ event listeners РІС–РґСЂР°Р·Сѓ Р±РµР· Р·Р°С‚СЂРёРјРєРё
  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('admin-clear').onclick = function () {
    // Р—Р°РїРёС‚СѓС”РјРѕ РїР°СЂРѕР»СЊ Р°РґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂР°
    const password = prompt('Enter admin password to clear leaderboard:');

    if (password === 'IrysOwner2024') {
      // РџСЂР°РІРёР»СЊРЅРёР№ РїР°СЂРѕР»СЊ - РїС–РґС‚РІРµСЂРґР¶СѓС”РјРѕ РґС–СЋ
      if (confirm('Admin access confirmed. Are you sure you want to clear the entire leaderboard? This action cannot be undone.')) {
        localStorage.removeItem('bubbleLeaderboard');
        alert('Leaderboard cleared successfully!');
        showLeaderboard(); // РћРЅРѕРІР»СЋС”РјРѕ РІС–РґРѕР±СЂР°Р¶РµРЅРЅСЏ
      }
    } else if (password !== null) {
      // РќРµРїСЂР°РІРёР»СЊРЅРёР№ РїР°СЂРѕР»СЊ (Р°Р»Рµ РЅРµ СЃРєР°СЃРѕРІР°РЅРѕ)
      alert('Access denied. Invalid admin password.');
    }
    // РЇРєС‰Рѕ password === null, РєРѕСЂРёСЃС‚СѓРІР°С‡ СЃРєР°СЃСѓРІР°РІ - РЅС–С‡РѕРіРѕ РЅРµ СЂРѕР±РёРјРѕ
  };
}

// Р“Р»РѕР±Р°Р»СЊРЅС– Р·РјС–РЅРЅС– РґР»СЏ СЂРѕР±РѕС‚Рё Р· РіР°РјР°РЅС†РµРј
let connectedWallet = null;
let walletAddress = null;

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїС–РґРєР»СЋС‡РµРЅРЅСЏ РіР°РјР°РЅС†СЏ
function showWalletConnection() {
  setGlobalBackground();

  const content = `
    <div class="wallet-connection" style="background:#ffffff; border:2px solid #43cea2; border-radius:24px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:48px 32px; text-align:center; max-width:420px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">рџ”— Connect Wallet</h2>
      
      ${connectedWallet ? `
        <div style="background:linear-gradient(135deg, #43cea2 0%, #185a9d 100%); border-radius:12px; padding:20px; margin:20px 0; color:white;">
          <h3 style="margin:0 0 10px 0;">вњ… Connected</h3>
          <p style="margin:0; font-size:0.9rem; opacity:0.9;">Wallet: ${connectedWallet}</p>
          <p style="margin:5px 0 0 0; font-size:0.8rem; opacity:0.8; word-break:break-all;">${walletAddress}</p>
          <button id="disconnect-btn" style="margin-top:15px; padding:8px 16px; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); border-radius:8px; color:white; cursor:pointer;">Disconnect</button>
        </div>
      ` : `
        <p style="color:#666; margin-bottom:30px; font-size:1.1rem;">Choose your wallet to connect:</p>
        
        <div style="display:flex; flex-direction:column; gap:16px; margin:20px 0;">
          <button id="metamask-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #f6851b; border-radius:12px; background:linear-gradient(135deg, #f6851b, #e2761b); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
            рџ¦Љ MetaMask
          </button>
          
          <button id="rabby-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #7c3aed; border-radius:12px; background:linear-gradient(135deg, #7c3aed, #6d28d9); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
            рџђ° Rabby Wallet
          </button>
          
          <button id="okx-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #000; border-radius:12px; background:linear-gradient(135deg, #000, #333); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
            вљ« OKX Wallet
          </button>
        </div>
      `}
      
      <div style="margin-top:30px;">
        <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
      </div>
      
      <div id="wallet-status" style="margin-top:20px; padding:10px; border-radius:8px; font-size:0.9rem;"></div>
    </div>
  `;

  smoothTransition(content);

  // Р”РѕРґР°С”РјРѕ event listeners
  document.getElementById('back-menu').onclick = showMainMenu;

  if (connectedWallet) {
    document.getElementById('disconnect-btn').onclick = disconnectWallet;
  } else {
    document.getElementById('metamask-btn').onclick = () => connectWallet('metamask');
    document.getElementById('rabby-btn').onclick = () => connectWallet('rabby');
    document.getElementById('okx-btn').onclick = () => connectWallet('okx');

    // Р”РѕРґР°С”РјРѕ hover РµС„РµРєС‚Рё РґР»СЏ РєРЅРѕРїРѕРє РіР°РјР°РЅС†С–РІ
    document.querySelectorAll('.wallet-btn').forEach(btn => {
      btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
      };
      btn.onmouseout = () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      };
    });
  }
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїС–РґРєР»СЋС‡РµРЅРЅСЏ РіР°РјР°РЅС†СЏ
async function connectWallet(walletType) {
  const statusDiv = document.getElementById('wallet-status');

  try {
    statusDiv.innerHTML = '<div style="color:#f39c12;">рџ”„ Connecting...</div>';

    let provider = null;
    let walletName = '';

    switch (walletType) {
      case 'metamask':
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
          provider = window.ethereum;
          walletName = 'MetaMask';
        } else {
          throw new Error('MetaMask not installed. Please install MetaMask extension.');
        }
        break;

      case 'rabby':
        if (typeof window.ethereum !== 'undefined' && window.ethereum.isRabby) {
          provider = window.ethereum;
          walletName = 'Rabby Wallet';
        } else {
          throw new Error('Rabby Wallet not installed. Please install Rabby Wallet extension.');
        }
        break;

      case 'okx':
        if (typeof window.okxwallet !== 'undefined') {
          provider = window.okxwallet;
          walletName = 'OKX Wallet';
        } else {
          throw new Error('OKX Wallet not installed. Please install OKX Wallet extension.');
        }
        break;
    }

    // Р—Р°РїРёС‚СѓС”РјРѕ РґРѕР·РІС–Р» РЅР° РїС–РґРєР»СЋС‡РµРЅРЅСЏ
    const accounts = await provider.request({ method: 'eth_requestAccounts' });

    if (accounts.length > 0) {
      connectedWallet = walletName;
      walletAddress = accounts[0];

      // Р—Р±РµСЂС–РіР°С”РјРѕ РІ localStorage
      localStorage.setItem('connectedWallet', walletName);
      localStorage.setItem('walletAddress', walletAddress);

      statusDiv.innerHTML = '<div style="color:#27ae60;">вњ… Successfully connected!</div>';

      // РћРЅРѕРІР»СЋС”РјРѕ С–РЅС‚РµСЂС„РµР№СЃ С‡РµСЂРµР· 1 СЃРµРєСѓРЅРґСѓ
      setTimeout(() => {
        showWalletConnection();
      }, 1000);

    } else {
      throw new Error('No accounts found');
    }

  } catch (error) {
    console.error('Wallet connection error:', error);
    statusDiv.innerHTML = `<div style="color:#e74c3c;">вќЊ ${error.message}</div>`;
  }
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РІС–РґРєР»СЋС‡РµРЅРЅСЏ РіР°РјР°РЅС†СЏ
function disconnectWallet() {
  connectedWallet = null;
  walletAddress = null;

  // Р’РёРґР°Р»СЏС”РјРѕ Р· localStorage
  localStorage.removeItem('connectedWallet');
  localStorage.removeItem('walletAddress');

  // РћРЅРѕРІР»СЋС”РјРѕ С–РЅС‚РµСЂС„РµР№СЃ
  showWalletConnection();
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїРµСЂРµРІС–СЂРєРё Р·Р±РµСЂРµР¶РµРЅРѕРіРѕ РїС–РґРєР»СЋС‡РµРЅРЅСЏ РїСЂРё Р·Р°РІР°РЅС‚Р°Р¶РµРЅРЅС–
function checkSavedWalletConnection() {
  const savedWallet = localStorage.getItem('connectedWallet');
  const savedAddress = localStorage.getItem('walletAddress');

  if (savedWallet && savedAddress) {
    connectedWallet = savedWallet;
    walletAddress = savedAddress;
  }
}

function showSettings() {
  // Р—Р±РµСЂС–РіР°С”РјРѕ С„РѕРЅ РІ РЅР°Р»Р°С€С‚СѓРІР°РЅРЅСЏС…
  setGlobalBackground();

  const savedName = localStorage.getItem('playerName') || '';
  const content = `
    <div class="settings" style="background:#ffffff; border:2px solid #43cea2; border-radius:24px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:48px 32px; text-align:center; max-width:340px; margin:0 auto;">
      <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">вљ™пёЏ Settings</h2>
      <form id="settings-form">
        <label for="player-name" style="font-size:1.1rem; color:#185a9d;">Player Name:</label><br>
        <input type="text" id="player-name" name="player-name" value="${savedName}" maxlength="16" placeholder="Enter your name" style="margin:18px 0 12px 0; padding:14px; border-radius:12px; border:1.5px solid #43cea2; width:220px; font-size:1.1rem; background:#f7fafc; box-shadow:0 2px 8px rgba(67,206,162,0.07); transition:border 0.3s ease-in-out;" required><br>
        <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
          <button type="submit" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">Save</button>
                      <button id="back-menu" type="button" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
        </div>
      </form>
      <div id="settings-msg" style="color:#2193b0; margin-top:14px; font-size:1.05rem;"></div>
    </div>
  `;
  smoothTransition(content);

  // Р”РѕРґР°С”РјРѕ event listeners РІС–РґСЂР°Р·Сѓ Р±РµР· Р·Р°С‚СЂРёРјРєРё
  document.getElementById('back-menu').onclick = showMainMenu;
  document.getElementById('settings-form').onsubmit = function (e) {
    e.preventDefault();
    const name = document.getElementById('player-name').value.trim();
    if (name.length === 0) {
      document.getElementById('settings-msg').textContent = 'Please enter your name.';
      return;
    }
    localStorage.setItem('playerName', name);
    document.getElementById('settings-msg').textContent = 'Name saved!';
  };
}

// Р†РЅС–С†С–Р°Р»С–Р·Р°С†С–СЏ РїСЂРё Р·Р°РІР°РЅС‚Р°Р¶РµРЅРЅС–
document.addEventListener('DOMContentLoaded', function () {
  // Р’СЃС‚Р°РЅРѕРІР»СЋС”РјРѕ С„РѕРЅ РІС–РґСЂР°Р·Сѓ
  setGlobalBackground();

  // РџРµСЂРµРІС–СЂСЏС”РјРѕ Р·Р±РµСЂРµР¶РµРЅРµ РїС–РґРєР»СЋС‡РµРЅРЅСЏ РіР°РјР°РЅС†СЏ
  checkSavedWalletConnection();

  // РџСЂРёР±РёСЂР°С”РјРѕ РІСЃС– РїРµСЂРµС…РѕРґРё Р· app
  const app = document.getElementById('app');
  app.style.transition = 'none';
  app.style.opacity = '1';
});

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ Р·Р°РїСѓСЃРєСѓ РіСЂРё Р· Irys С‚СЂР°РЅР·Р°РєС†С–С”СЋ
async function startGameWithTransaction(gameMode, gameInstance) {
  try {
    console.log(`рџљЂ Starting ${gameMode} mode with Irys transaction...`);
    console.log('Connected wallet:', connectedWallet);
    console.log('Wallet address:', walletAddress);

    // РџРѕРєР°Р·СѓС”РјРѕ РјРѕРґР°Р»СЊРЅРµ РІС–РєРЅРѕ РїС–РґС‚РІРµСЂРґР¶РµРЅРЅСЏ С‚СЂР°РЅР·Р°РєС†С–С—
    showTransactionModal(gameMode, async () => {
      try {
        // Р†РЅС–С†С–Р°Р»С–Р·СѓС”РјРѕ Irys С–РЅС‚РµРіСЂР°С†С–СЋ
        if (typeof window.IrysIntegration !== 'undefined') {
          const result = await window.IrysIntegration.startGameWithIrys(
            gameMode,
            window.ethereum,
            walletAddress
          );

          if (result.success) {
            console.log('вњ… Transaction successful, starting game...');
            hideTransactionModal();

            // Р—Р°РїСѓСЃРєР°С”РјРѕ РіСЂСѓ Р· РѕР±СЂР°РЅРёРј СЂРµР¶РёРјРѕРј
            gameInstance.gameMode = gameMode;
            gameInstance.init();
          } else {
            throw new Error(result.error || 'Transaction failed');
          }
        } else {
          console.warn('вљ пёЏ Irys integration not available, starting game without transaction');
          hideTransactionModal();
          gameInstance.gameMode = gameMode;
          gameInstance.init();
        }
      } catch (error) {
        console.error('вќЊ Transaction failed:', error);
        hideTransactionModal();
        alert(`Transaction failed: ${error.message}`);
      }
    });

  } catch (error) {
    console.error('вќЊ Failed to start game with transaction:', error);
    alert(`Failed to start game: ${error.message}`);
  }
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїРѕРєР°Р·Сѓ РјРѕРґР°Р»СЊРЅРѕРіРѕ РІС–РєРЅР° С‚СЂР°РЅР·Р°РєС†С–С—
function showTransactionModal(gameMode, onConfirm) {
  const modal = document.createElement('div');
  modal.id = 'transaction-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideInUp 0.4s ease-out;
    ">
      <h2 style="color: #2193b0; margin-bottom: 20px; font-size: 1.8rem;">рџЋ® Start ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)} Mode</h2>
      
      <div style="background: linear-gradient(135deg, #43cea2, #185a9d); color: white; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 1.1rem;">рџ”— Connected Wallet:</p>
        <p style="margin: 0; font-size: 0.9rem; opacity: 0.9; word-break: break-all;">${walletAddress}</p>
      </div>
      
      <p style="color: #666; margin: 20px 0; font-size: 1rem;">
        To start the game, you need to sign a transaction on the Irys testnet. 
        This will create a game session record on the decentralized network.
      </p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; font-size: 0.9rem; color: #666;">
          рџ“ќ <strong>Game Mode:</strong> ${gameMode}<br>
          рџЊђ <strong>Network:</strong> Irys Testnet<br>
          рџ’° <strong>Cost:</strong> Free (Testnet)
        </p>
      </div>
      
      <div id="transaction-status" style="margin: 20px 0; padding: 10px; border-radius: 8px; font-size: 0.9rem;"></div>
      
      <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
        <button id="confirm-transaction" style="
          padding: 12px 30px;
          background: linear-gradient(135deg, #43cea2, #185a9d);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        ">рџљЂ Sign & Start Game</button>
        
        <button id="cancel-transaction" style="
          padding: 12px 30px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        ">вќЊ Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Р”РѕРґР°С”РјРѕ РѕР±СЂРѕР±РЅРёРєРё РїРѕРґС–Р№
  document.getElementById('confirm-transaction').onclick = () => {
    document.getElementById('transaction-status').innerHTML = '<div style="color: #f39c12;">рџ”„ Processing transaction...</div>';
    document.getElementById('confirm-transaction').disabled = true;
    document.getElementById('confirm-transaction').style.opacity = '0.6';
    onConfirm();
  };

  document.getElementById('cancel-transaction').onclick = hideTransactionModal;

  // Р—Р°РєСЂРёС‚С‚СЏ РїРѕ РєР»С–РєСѓ РЅР° С„РѕРЅ
  modal.onclick = (e) => {
    if (e.target === modal) {
      hideTransactionModal();
    }
  };
}

// Р¤СѓРЅРєС†С–СЏ РґР»СЏ РїСЂРёС…РѕРІСѓРІР°РЅРЅСЏ РјРѕРґР°Р»СЊРЅРѕРіРѕ РІС–РєРЅР° С‚СЂР°РЅР·Р°РєС†С–С—
function hideTransactionModal() {
  const modal = document.getElementById('transaction-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-in';
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 300);
  }
}

// Р—Р°РїСѓСЃРє Р· РіРѕР»РѕРІРЅРѕРіРѕ РјРµРЅСЋ
showMainMenu();
