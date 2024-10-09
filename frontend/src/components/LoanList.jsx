import React, { useState, useEffect } from 'react';
import { useRepayLoanMutation, useGetLoansQuery, useAddPublicKeyMutation } from '../features/api/apiSlice';
import LoanActions from './LoanActions';
import { checkIfWalletIsConnected, connectWallet, sendTransaction } from '../utils/web3Utils';
import { useSelector, useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import ErrorModal from './ErrorModal';
import LoadingOverlay from './LoadingOverlay';

const LoanList = () => {
  const [repayLoan, { isLoading: isRepaying, error: repayError }] = useRepayLoanMutation();
  const [addPublicKey, { isError: isAddKeyError, error: addKeyError }] = useAddPublicKeyMutation();
  const [requestRenegotiate, { isLoading: isRequestingRenegotiation, error: requestRenegotiationError }] = useRequestRenegotiationMutation();
  const [approveRenegotiation, { isLoading: isApprovingRenegotiation, error: approveRenegotiationError }] = useApproveRenegotiationMutation();
  const [isRefetching, setIsRefetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tab, setTab] = useState('borrowed'); // Manage current tab (borrowed, lent, requests)
  const { data: loans = [], isFetching: isLoadingLoans, error: loansError, refetch: refetchLoans } = useGetLoansQuery(
    {is_borrower:tab === 'borrowed'|| tab==='sent-requests',
    is_request: tab === 'sent-requests'||tab==='receive-requests'});
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleRefetchLoans = async () => {
    setIsRefetching(true);
    try {
      await refetchLoans();
      if (repayError) {
        throw new Error(repayError.data?.message || 'Repayment error occurred');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to refetch loans. Please try again.');
    } finally {
      setIsRefetching(false);
    }
  };

  const handleRepayLoan = async (loanId, amount) => {
    try {
      let publicKey = auth.publicKey;

      // If publicKey is not available, connect wallet and add the public key
      if (!publicKey) {
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));

        // Try adding public key to the server
        try {
          await addPublicKey({ publicKey }).unwrap();
        } catch (addKeyError) {
          throw new Error(addKeyError?.data?.message || 'Failed to add public key. Please try again.');
        }
      } else {
        checkIfWalletIsConnected(publicKey);
      }

      // Proceed with loan repayment
      const response = await repayLoan({ loan_id: loanId, amount }).unwrap();
      if (!response || !response.tx) throw new Error('Failed to get repayment transaction data.');

      // Send transaction using the connected public key
      const transferResult = await sendTransaction(response.tx, publicKey);
      if (!transferResult) throw new Error('Transfer transaction failed.');

      // Refetch loans after successful repayment
      refetchLoans();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to repay loan. Please try again.');
    }
  };

  const handleRequestRenegotiation = async (loanId, newDueDate) => {
    try {
      let publicKey = auth.publicKey;

      // If publicKey is not available, connect wallet and add the public key
      if (!publicKey) {
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));

        // Try adding public key to the server
        try {
          await addPublicKey({ publicKey }).unwrap();
        } catch (addKeyError) {
          throw new Error(addKeyError?.data?.message || 'Failed to add public key. Please try again.');
        }
      } else {
        checkIfWalletIsConnected(publicKey);
      }

      // Proceed with loan repayment
      const response = await requestRenegotiate({ loan_id: loanId, amount }).unwrap();
      if (!response || !response.tx) throw new Error('Failed to get repayment transaction data.');

      // Send transaction using the connected public key
      const transferResult = await sendTransaction(response.tx, publicKey);
      if (!transferResult) throw new Error('Transfer transaction failed.');

      // Refetch loans after successful repayment
      refetchLoans();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to repay loan. Please try again.');
    }
  };


  const handleCloseErrorModal = () => {
    setErrorMessage(null);
  };

  useEffect(() => {
    if (loansError) {
      setErrorMessage(loansError.data?.message || 'Failed to fetch loans. Please try again.');
    }
  }, [loansError]);

  return (
    <div className="p-6 bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg rounded-lg max-w-2xl mx-auto">
      {isRefetching && <LoadingOverlay />}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold text-white">Loans</h3>
        <button
          onClick={handleRefetchLoans}
          className={`p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all duration-300 flex items-center ${isRefetching ? 'animate-spin' : ''}`}
          title="Refetch Loans"
          disabled={isRefetching}
        >
          <FontAwesomeIcon icon={faSyncAlt} className="text-white text-lg" />
        </button>
      </div>
      <div className="mb-6 flex justify-center border-b border-gray-700">
        <button
          onClick={() => setTab('borrowed')}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${tab === 'borrowed' ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Borrowed Loans
        </button>
        <button
          onClick={() => setTab('lent')}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${tab === 'lent' ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Lent Loans
        </button>
        <button
          onClick={() => setTab('sent-requests')}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${tab === 'sent-requests' ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Requests Sent
        </button>
        <button
          onClick={() => setTab('receive-requests')}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${tab === 'receive-requests' ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Requests Received
        </button>
      </div>
      {isLoadingLoans ? (
        <LoadingOverlay />
      ) : loans.length === 0 ? (
        <p className="text-center text-gray-400">No loans found.</p>
      ) : (
        loans.map((loan) => (
          <li
            key={loan.loanId}
            className="flex justify-between items-center bg-gray-800 p-4 m-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="flex-1">
              {tab === 'receive-requests'||tab==='sent-requests' ? <div className="text-sm text-gray-300">Borrower: {loan.borrower}</div> : <div className="text-sm text-gray-300">Lender: {loan.lender}</div>}
              <p className="text-xl font-bold text-blue-400">{loan.amount} ETH</p>
              <p className="text-sm text-gray-300">Collateral: {loan.collateral}</p>
              <p className={`text-sm ${loan.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
                Status: {loan.status}
              </p>
            </div>
            {loan.status === 'Pending' && tab === 'receive-requests' && (
              <LoanActions loanId={loan.loanId} refetchLoans={refetchLoans} />
            )}
            {loan.status === 'Approved' && tab === 'borrowed' && (
              <button
                onClick={() => handleRepayLoan(loan.loanId, loan.amount)}
                className={`p-2 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-all duration-300 flex items-center ${
                  isRepaying ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isRepaying}
              >
                {isRepaying ? (
                  <div className="loader border-t-4 border-b-4 border-white rounded-full w-4 h-4 animate-spin mr-2"></div>
                ) : (
                  'Repay Loan'
                )}
              </button>
            )}
          </li>
        ))
      )}
      {errorMessage && <ErrorModal message={errorMessage} onClose={handleCloseErrorModal} />}
    </div>
  );
};

export default LoanList;
