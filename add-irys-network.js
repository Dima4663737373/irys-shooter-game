// Скрипт для додавання Irys Testnet до MetaMask
async function addIrysTestnet() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x4F6', // 1270 в hex
        chainName: 'Irys Testnet',
        nativeCurrency: {
          name: 'IRYS',
          symbol: 'IRYS',
          decimals: 18
        },
        rpcUrls: ['https://testnet-rpc.irys.xyz/v1/execution-rpc'],
        blockExplorerUrls: ['https://testnet-explorer.irys.xyz/']
      }]
    });
    console.log('✅ Irys Testnet додано до MetaMask');
  } catch (error) {
    console.error('❌ Помилка додавання мережі:', error);
  }
}

// Викликати функцію
addIrysTestnet();