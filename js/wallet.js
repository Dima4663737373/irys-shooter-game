// Wallet connection functionality
export class WalletManager {
  constructor() {
    this.connectedWallet = null;
    this.walletAddress = null;
    this.checkSavedConnection();
  }

  checkSavedConnection() {
    const savedWallet = localStorage.getItem('connectedWallet');
    const savedAddress = localStorage.getItem('walletAddress');

    if (savedWallet && savedAddress) {
      this.connectedWallet = savedWallet;
      this.walletAddress = savedAddress;
    }
  }

  async connectWallet(walletType) {
    try {
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

      const accounts = await provider.request({ method: 'eth_requestAccounts' });

      if (accounts.length > 0) {
        this.connectedWallet = walletName;
        this.walletAddress = accounts[0];

        localStorage.setItem('connectedWallet', walletName);
        localStorage.setItem('walletAddress', this.walletAddress);

        return { success: true, wallet: walletName, address: this.walletAddress };
      } else {
        throw new Error('No accounts found');
      }

    } catch (error) {
      console.error('Wallet connection error:', error);
      return { success: false, error: error.message };
    }
  }

  disconnectWallet() {
    this.connectedWallet = null;
    this.walletAddress = null;

    localStorage.removeItem('connectedWallet');
    localStorage.removeItem('walletAddress');
  }

  isConnected() {
    return this.connectedWallet && this.walletAddress;
  }

  getWalletInfo() {
    return {
      wallet: this.connectedWallet,
      address: this.walletAddress
    };
  }
}