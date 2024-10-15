import React, { useState } from 'react';
import { useApproveLoanMutation, useRejectLoanMutation, useAddPublicKeyMutation, useSendNotificationMutation } from '../features/api/apiSlice';
import { checkIfWalletIsConnected, connectWallet, sendTransaction } from '../utils/web3Utils';
import ErrorModal from './ErrorModal';
import { useSelector, useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';
import { motion } from 'framer-motion';

const LoanActions = ({ loanId, refetchLoans, friendId }) => {
  const [approveLoan] = useApproveLoanMutation();
  const [rejectLoan] = useRejectLoanMutation();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [addPublicKey] = useAddPublicKeyMutation();
  const [sendNotification] = useSendNotificationMutation();

  const handleTransaction = async (transactionFn, params, notification) => {
    setIsLoading(true);
    setError(null);
    try {
      let publicKey = auth.publicKey;

      if (!publicKey) {
        publicKey = await connectWallet();
        if (!publicKey) throw new Error('Failed to connect to wallet.');
        dispatch(setPublicKey(publicKey));
        await addPublicKey({ publicKey }).unwrap();
      } else {
        await checkIfWalletIsConnected(publicKey);
      }

      const response = await transactionFn(params).unwrap();
      if (!response || !response.tx) throw new Error('No transaction data received.');

      const transactionHash = await sendTransaction(response.tx, publicKey);
      await sendNotification({ ...notification, to: friendId });
      console.log('Transaction successful, hash:', transactionHash);
      refetchLoans();
    } catch (error) {
      console.error('Transaction failed:', error);
      setError(error.message || 'An error occurred during the transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLoan = () => handleTransaction(approveLoan, { loan_id: loanId }, { title: 'Loan Approved', body: 'Your loan has been approved by the lender' });
  const handleRejectLoan = () => handleTransaction(rejectLoan, { loan_id: loanId }, { title: 'Loan Rejected', body: 'Your loan request has been rejected by the lender' });

  return (
    <div className="flex space-x-2">
      <motion.button
        onClick={handleApproveLoan}
        className={`px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white font-semibold shadow-md transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? 'Approving...' : 'Approve'}
      </motion.button>
      <motion.button
        onClick={handleRejectLoan}
        className={`px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-semibold shadow-md transition-all duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? 'Rejecting...' : 'Reject'}
      </motion.button>
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default LoanActions;