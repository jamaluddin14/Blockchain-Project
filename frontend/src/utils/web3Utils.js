import Web3 from 'web3';
import BigNumber from 'bignumber.js';
let web3;

/**
 * Initialize Web3 instance
 */
const initWeb3 = () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      console.log('Web3 initialized with window.ethereum');
    } else {
      console.warn('Ethereum object not found. Ensure you have MetaMask installed.');
      web3 = new Web3(process.env.REACT_APP_GANACHE_URL); // Fallback to local node
      console.log('Web3 initialized with local node');
    }
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
  }
};

initWeb3();

/**
 * Check if the user's wallet is connected.
 * @returns {Promise<string|null>} - Returns the connected wallet address or null if not connected.
 */
export const checkIfWalletIsConnected = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        console.log('Wallet connected:', accounts[0]);
        return accounts[0];
      } else {
        console.log('No accounts found. Wallet may not be connected.');
        return connectWallet();
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return null;
    }
  }
  console.warn('Ethereum object not found. Ensure you have MetaMask installed.');
  return null;
};

/**
 * Connect the user's wallet and open MetaMask if necessary.
 * @returns {Promise<string>} - Returns the connected wallet address.
 * @throws {Error} - Throws an error if connection fails.
 */
export const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request MetaMask to open
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        });
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Wallet connected:', accounts[0]);
        return accounts[0];
      } catch (error) {
        if (error.code === 4001) {
          console.error('User rejected the connection request');
          throw new Error('User rejected the connection request');
        } else {
          console.error('Failed to connect to wallet:', error);
          throw new Error('Failed to connect to wallet: ' + error.message);
        }
      }
    } else {
      console.error('MetaMask is not installed');
      throw new Error('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  export const sendTransaction = async (tx, publicKey) => {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed');
      throw new Error('MetaMask is not installed. Please install it to send transactions.');
    }
    console.log(tx)
    try {
      // Prepare the transaction object for EIP-155
      const transaction = {
        from: publicKey,
        to: tx.to,
        value: tx.value, // Convert to BigNumber and then to hex
        gas: tx.gas, // Gas limit as a number
        maxFeePerGas: tx.maxFeePerGas, // Convert max fee to BigNumber and then to hex
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas, // Convert max priority fee to BigNumber and then to hex
        data: tx.data || '0x',
      };
  
      console.log('Sending transaction:', transaction);
  
      // Send the transaction
      const response = await web3.eth.sendTransaction(transaction);
      console.log('Transaction sent successfully:', response.transactionHash);
      return response.transactionHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  };
  
  // Log when the module is loaded
  console.log('MetaMask utility functions loaded');