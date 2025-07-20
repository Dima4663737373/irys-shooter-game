// UI management functions
export class UIManager {
  constructor() {
    this.app = document.getElementById('app');
  }

  setGlobalBackground() {
    document.body.style.background = "url('/menu-bg.jpg') center center / cover no-repeat fixed";
  }

  smoothTransition(newContent) {
    this.app.style.transition = 'none';
    this.app.style.opacity = '1';
    this.app.innerHTML = newContent;
  }

  playMenuSound() {
    if (window.AudioContext || window.webkitAudioContext) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
      } catch (e) {
        console.warn('Error playing menu sound:', e);
      }
    }
  }

  addButtonHoverEffects(buttons) {
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        this.playMenuSound();
        button.style.transform = 'scale(1.05) translateY(-2px)';
        button.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1) translateY(0)';
        button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });
    });
  }

  showMainMenu() {
    this.setGlobalBackground();
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
        ">Irys Shooter</h1>
        
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
        ">
        <button id="play-btn" style="animation: slideInLeft 0.6s ease-out 0.3s both;">🎮 Play</button>
        <button id="connect-wallet-btn" style="animation: slideInUp 0.6s ease-out 0.4s both;">🔗 Connect Wallet</button>
        <button id="leaderboard-btn" style="animation: slideInUp 0.6s ease-out 0.5s both;">🏆 Leaderboard</button>
        <button id="settings-btn" style="animation: slideInRight 0.6s ease-out 0.7s both;">⚙️ Settings</button>
        </div>
      </div>
    `;

    this.smoothTransition(content);
    const buttons = document.querySelectorAll('.main-menu button');
    this.addButtonHoverEffects(buttons);

    return {
      playBtn: document.getElementById('play-btn'),
      connectWalletBtn: document.getElementById('connect-wallet-btn'),
      leaderboardBtn: document.getElementById('leaderboard-btn'),
      settingsBtn: document.getElementById('settings-btn')
    };
  }

  showWalletConnection(walletManager) {
    this.setGlobalBackground();

    const content = `
      <div class="wallet-connection" style="background:#ffffff; border:2px solid #43cea2; border-radius:24px; box-shadow:0 16px 48px rgba(0,0,0,0.3), 0 8px 24px rgba(67,206,162,0.2); padding:48px 32px; text-align:center; max-width:420px; margin:0 auto;">
        <h2 style="font-size:2rem; color:#2193b0; margin-bottom:24px; letter-spacing:1px; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🔗 Connect Wallet</h2>
        
        ${walletManager.isConnected() ? `
          <div style="background:linear-gradient(135deg, #43cea2 0%, #185a9d 100%); border-radius:12px; padding:20px; margin:20px 0; color:white;">
            <h3 style="margin:0 0 10px 0;">✅ Connected</h3>
            <p style="margin:0; font-size:0.9rem; opacity:0.9;">Wallet: ${walletManager.connectedWallet}</p>
            <p style="margin:5px 0 0 0; font-size:0.8rem; opacity:0.8; word-break:break-all;">${walletManager.walletAddress}</p>
            <button id="disconnect-btn" style="margin-top:15px; padding:8px 16px; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); border-radius:8px; color:white; cursor:pointer;">Disconnect</button>
          </div>
        ` : `
          <p style="color:#666; margin-bottom:30px; font-size:1.1rem;">Choose your wallet to connect:</p>
          
          <div style="display:flex; flex-direction:column; gap:16px; margin:20px 0;">
            <button id="metamask-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #f6851b; border-radius:12px; background:linear-gradient(135deg, #f6851b, #e2761b); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
              🦊 MetaMask
            </button>
            
            <button id="rabby-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #7c3aed; border-radius:12px; background:linear-gradient(135deg, #7c3aed, #6d28d9); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
              🐰 Rabby Wallet
            </button>
            
            <button id="okx-btn" class="wallet-btn" style="display:flex; align-items:center; justify-content:center; gap:12px; padding:16px 20px; border:2px solid #000; border-radius:12px; background:linear-gradient(135deg, #000, #333); color:white; font-size:1.1rem; font-weight:bold; cursor:pointer; transition:all 0.3s ease;">
              ⚫ OKX Wallet
            </button>
          </div>
        `}
        
        <div style="margin-top:30px;">
          <button id="back-menu" style="width:140px; padding:14px 0; font-size:1.1rem; border-radius:12px; border:none; background:linear-gradient(90deg,#43cea2 0%,#185a9d 100%); color:#fff; font-weight:bold; cursor:pointer; transition:background 0.35s ease-out,transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:0 2px 8px rgba(67,206,162,0.10);">Back</button>
        </div>
        
        <div id="wallet-status" style="margin-top:20px; padding:10px; border-radius:8px; font-size:0.9rem;"></div>
      </div>
    `;

    this.smoothTransition(content);

    return {
      backBtn: document.getElementById('back-menu'),
      disconnectBtn: document.getElementById('disconnect-btn'),
      metamaskBtn: document.getElementById('metamask-btn'),
      rabbyBtn: document.getElementById('rabby-btn'),
      okxBtn: document.getElementById('okx-btn'),
      statusDiv: document.getElementById('wallet-status'),
      walletBtns: document.querySelectorAll('.wallet-btn')
    };
  }
}