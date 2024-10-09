import React, { useState } from 'react';
import { useApproveLoanMutation, useRejectLoanMutation ,useAddPublicKeyMutation} from '../features/api/apiSlice';
import { checkIfWalletIsConnected, connectWallet, sendTransaction } from '../utils/web3Utils';
import ErrorModal from './ErrorModal';
import { useSelector, useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';

const LoanActions = ({ loanId, refetchLoans }) => {
  const [approveLoan] = useApproveLoanMutation();
  const [rejectLoan] = useRejectLoanMutation();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [addPublicKey]=useAddPublicKeyMutation();

  const handleApproveLoan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let publicKey=auth.publicKey;
      
      if (!publicKey) {
        publicKey = await connectWallet();
        if (!publicKey) throw new Error('Failed to connect to wallet.');
        dispatch(setPublicKey(publicKey));
      } 
      else {
        await checkIfWalletIsConnected(publicKey);
      }

      const response = await approveLoan({ loan_id: loanId }).unwrap();
      if (response && response.tx) {
        const transactionHash = await sendTransaction(response.tx, publicKey);
        console.log('Transaction successful, hash:', transactionHash);
      } else {
        throw new Error('No transaction data received from the API.');
      }
      refetchLoans();
    } catch (error) {
      console.error('Failed to approve loan:', error);
      setError(error.message || 'An error occurred while approving the loan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectLoan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let publicKey = auth.publicKey
      if (!publicKey) {
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));
        addPublicKey(publicKey)
      }
      const gasTransaction = await rejectLoan({ loan_id: loanId }).unwrap();
      if (!gasTransaction || !gasTransaction.tx) throw new Error('No transaction data received.');

      const txHash = await sendTransaction(gasTransaction.tx, publicKey);
      console.log('Transaction successful, hash:', txHash);
      refetchLoans();
    } catch (error) {
      console.error('Failed to reject loan:', error);
      setError(error.message || 'An error occurred while rejecting the loan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="loan-actions">
      <button
        onClick={handleApproveLoan}
        className={`p-3 bg-green-600 hover:bg-green-700 rounded-md mr-2 transition-all duration-300 text-white font-semibold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Approving...' : 'Approve'}
      </button>
      <button
        onClick={handleRejectLoan}
        className={`p-3 bg-red-600 hover:bg-red-700 rounded-md transition-all duration-300 text-white font-semibold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Rejecting...' : 'Reject'}
      </button>
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default LoanActions;
