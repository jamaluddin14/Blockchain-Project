import Web3 from 'web3';
let web3;

/**
 * Initialize Web3 instance
 */
const ganacheUrl=import.meta.env.VITE_GANACHE_URL;
const initWeb3 = () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      web3 = new Web3(window.ethereum);
      console.log('Web3 initialized with window.ethereum');
    } else {
      console.warn('Ethereum object not found. Ensure you have MetaMask installed.');
      web3 = new Web3(ganacheUrl); // Fallback to local node
      console.log('Web3 initialized with local node');
    }
  } catch (error) {
    console.error('Failed to initialize Web3:', error);
  }
};

initWeb3();

/**
 * Check if the user's wallet is connected and matches the passed public key.
 * Requests connection if the wallet is not connected.
 * @param {string} publicKey - The public key (wallet address) to check for connection.
 * @returns {Promise<boolean>} - Returns true if the wallet is connected and matches the public key, otherwise raises an error.
 */
export const checkIfWalletIsConnected = async (publicKey) => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Get the current connected accounts from MetaMask
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length > 0) {
        // Iterate through connected accounts and check if any match the passed public key
        for (let i = 0; i < accounts.length; i++) {
          if (accounts[i].toLowerCase() === publicKey.toLowerCase()) {
            console.log('Wallet connected:', accounts[i]);
            return true; // Wallet is connected and matches the public key
          }
        }
        // If no accounts match, throw an error after the loop
        throw new Error('Connected wallet does not match the provided public key.');
      } else {
        console.log('No accounts found. Wallet may not be connected.');
        
        // Request connection to the user's wallet
        const connectedAccounts = await requestWalletConnection();

        // Check if the connected account matches the public key
        if (connectedAccounts.length > 0 && connectedAccounts[0].toLowerCase() === publicKey.toLowerCase()) {
          console.log('Wallet connected after request:', connectedAccounts[0]);
          return true; // Wallet successfully connected and matches the public key
        } else {
          throw new Error('Wallet connection rejected or no matching public key found.');
        }
      }
    } catch (error) {
      console.error('Error during wallet connection process:', error.message);
      throw new Error(error.message || 'Failed to connect the wallet.');
    }
  } else {
    console.warn('Ethereum object not found. Ensure you have MetaMask installed.');
    throw new Error('MetaMask not installed.');
  }
};


/**
 * Requests the user to connect their MetaMask wallet.
 * @returns {Promise<string[]>} - Returns the connected accounts after the user approves connection.
 */
const requestWalletConnection = async () => {
  try {
    // Request the user to connect their wallet
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    return accounts;
  } catch (error) {
    throw new Error('Wallet connection request was rejected.');
  }
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
    
    console.log(tx);
    
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

        // Wait for the transaction receipt
        const receipt = await web3.eth.getTransactionReceipt(response.transactionHash);
        return receipt
    } catch (error) {
        console.log('Transaction failed:', error);
        throw new Error(`Transaction failed: ${error.message}`);
    }
};

  
  // Log when the module is loaded
  console.log('MetaMask utility functions loaded');