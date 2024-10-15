import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRepayLoanMutation, useGetLoansQuery, useAddPublicKeyMutation, useRequestRenegotiationMutation, useApproveRenegotiationMutation, useSendNotificationMutation } from '../features/api/apiSlice';
import LoanActions from './LoanActions';
import { checkIfWalletIsConnected, connectWallet, sendTransaction } from '../utils/web3Utils';
import { useSelector, useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowRight } from 'lucide-react';
import ErrorModal from './ErrorModal';
import LoadingOverlay from './LoadingOverlay';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const tabs = [
  { id: 'borrowed', label: 'Borrowed Loans' },
  { id: 'lent', label: 'Lent Loans' },
  { id: 'sent-requests', label: 'Requests Sent' },
  { id: 'receive-requests', label: 'Requests Received' }
];

const LoanList = ({ requestsCount: requestCount, setRequestsCount: setRequestCount }) => {
  const [isRefetching, setIsRefetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tab, setTab] = useState('borrowed');
  const [renegotiationDate, setRenegotiationDate] = useState(null);
  const [showRenegotiationModal, setShowRenegotiationModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState({lender_id: null, loanId: null});

  const queryParams = useMemo(() => ({
    is_borrower: tab === 'borrowed' || tab === 'sent-requests',
    is_request: tab === 'sent-requests' || tab === 'receive-requests'
  }), [tab]);

  const { data: loans = [], isFetching: isLoadingLoans, refetch: refetchLoans } = useGetLoansQuery(queryParams);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [repayLoan] = useRepayLoanMutation();
  const [addPublicKey] = useAddPublicKeyMutation();
  const [requestRenegotiation] = useRequestRenegotiationMutation();
  const [approveRenegotiation] = useApproveRenegotiationMutation();
  const [sendNotification] = useSendNotificationMutation();

  const handleRefetchLoans = useCallback(async () => {
    setIsRefetching(true);
    try {
      await refetchLoans();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to refetch loans. Please try again.');
    } finally {
      setIsRefetching(false);
    }
  }, [refetchLoans]);

  const handleTransaction = useCallback(async (transactionFn, params, notification) => {
    try {
      let publicKey = auth.publicKey;

      if (!publicKey) {
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));
        await addPublicKey({ publicKey }).unwrap();
      } else {
        checkIfWalletIsConnected(publicKey);
      }

      const response = await transactionFn(params).unwrap();
      if (!response || !response.tx) throw new Error('Failed to get transaction data.');

      const transferResult = await sendTransaction(response.tx, publicKey);
      if (!transferResult) throw new Error('Transaction failed.');

      if (notification) {
        await sendNotification({...notification}).unwrap();
      }

      refetchLoans();
    } catch (error) {
      setErrorMessage(error.message || 'Transaction failed. Please try again.');
    }
  }, [auth.publicKey, addPublicKey, dispatch, refetchLoans, sendNotification]);

  const handleRepayLoan = useCallback((loanId, amount, friendId) => {
    const notification = {
      title: 'Loan Repaid',
      body: 'Your loan has been repaid by the borrower',
      to: friendId
    }
    handleTransaction(repayLoan, { loan_id: loanId, amount }, notification);
  }, [handleTransaction, repayLoan]);

  const handleRequestRenegotiation = useCallback(() => {
    const notification = {
      title: 'Renegotiation Request',
      body: 'You have a new renegotiation request from the borrower',
      to: selectedLoanId.lender_id
    }
    handleTransaction(requestRenegotiation, { loan_id: selectedLoanId.loanId, new_due_date: renegotiationDate.toISOString()}, notification);
    setShowRenegotiationModal(false);
  }, [handleTransaction, selectedLoanId, renegotiationDate, requestRenegotiation]);

  const handleApproveRenegotiation = useCallback((loanId, friendId) => {
    const notification = {
      title: 'Renegotiation Approved',
      body: 'Your renegotiation request has been approved by the lender',
      to: friendId
    };
    handleTransaction(approveRenegotiation, { loan_id: loanId }, notification);
  }, [handleTransaction, approveRenegotiation]);

  const handleCloseErrorModal = useCallback(() => {
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (tab === 'receive-requests') {
      if (requestCount > 0) {
        handleRefetchLoans();
        setRequestCount(0);
      }
    }
  }, [tab, requestCount, handleRefetchLoans, setRequestCount]);

  const renderLoanItem = useCallback((loan) => (
    <motion.li
      key={loan.loanId}
      className="bg-gray-800 p-6 m-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">
            {(tab === 'receive-requests' || tab === 'sent-requests') ? 
              `Borrower: ${loan.borrower}` : 
              `Lender: ${loan.lender}`
            }
          </p>
          <p className="text-2xl font-bold text-blue-400 mb-2">{loan.amount} ETH</p>
          <p className="text-sm text-gray-300 mb-1">Collateral: {loan.collateral}</p>
          <p className={`text-sm mb-1 ${loan.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
            Status: {loan.status}
          </p>
          <p className="text-sm text-gray-300 mb-1">Due Date: {new Date(loan.due_date).toLocaleDateString()}</p>
          {loan.renegotiation_request && (
            <>
              <p className="text-sm text-yellow-400 mb-1">Renegotiation Requested</p>
              {loan.new_due_date && (
                <p className="text-sm text-yellow-400 mb-1">
                  New Due Date: {new Date(loan.new_due_date).toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          {loan.status === 'Approved' && tab === 'borrowed' && (
            <>
              <motion.button
                onClick={() => handleRepayLoan(loan.loanId, loan.amount, loan.lender_id)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm font-semibold text-white shadow-md transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Repay Loan
              </motion.button>
              {!loan.renegotiation_request && (
                <motion.button
                  onClick={() => {
                    setSelectedLoanId(loan);
                    setShowRenegotiationModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white shadow-md transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Request Renegotiation
                </motion.button>
              )}
            </>
          )}
          {loan.status === 'Pending' && tab === 'receive-requests' && (
            <LoanActions loanId={loan.loanId} refetchLoans={refetchLoans} friendId={loan.borrower_id} />
          )}
          {loan.status === 'Lended' && tab === 'receive-requests' && loan.renegotiation_request && (
            <motion.button
              onClick={() => handleApproveRenegotiation(loan.loanId, loan.borrower_id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white shadow-md transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Approve Renegotiation
            </motion.button>
          )}
        </div>
      </div>
    </motion.li>
  ), [tab, handleRepayLoan, refetchLoans, handleApproveRenegotiation]);

  return (
<div className="p-6 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg rounded-lg max-w-4xl mx-auto">
      {(isRefetching || isLoadingLoans) && <LoadingOverlay />}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Loans</h3>
        <motion.button
          onClick={handleRefetchLoans}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-300 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={isRefetching}
        >
          <RefreshCw size={20} className={`text-blue-400 ${isRefetching ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>
      <div className="mb-6 flex flex-wrap justify-start border-b border-gray-700">
        {tabs.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none ${
              tab === t.id
                ? 'bg-gray-800 text-blue-400 border-l border-t border-r border-gray-700 rounded-t-md -mb-px'
                : 'bg-gray-900 text-gray-400 border-b border-gray-700 hover:text-gray-200'
            }`}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            {t.label}
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {loans.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {loans.map(renderLoanItem)}
          </motion.ul>
        ) : (
          <motion.p
            className="text-white text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            No loans found.
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showRenegotiationModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 p-6 rounded-lg shadow-xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h4 className="text-white text-lg font-bold mb-4">Select a New Due Date</h4>
              <DatePicker
                selected={renegotiationDate}
                onChange={(date) => setRenegotiationDate(date)}
                minDate={new Date()}
                dateFormat="yyyy/MM/dd"
                className="p-2 rounded-md bg-gray-700 text-white w-full mb-4"
              />
              <div className="flex justify-end space-x-4">
                <motion.button
                  onClick={() => setShowRenegotiationModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm font-semibold text-white transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleRequestRenegotiation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold text-white transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Request <ArrowRight size={16} className="inline ml-1" />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {errorMessage && <ErrorModal message={errorMessage} onClose={handleCloseErrorModal} />}
    </div>
  );
};

export default LoanList;