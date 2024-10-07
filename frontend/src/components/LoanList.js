import React, { useState } from 'react';
import { useRepayLoanMutation, useGetLoansQuery } from '../features/api/apiSlice';
import LoanActions from './LoanActions';
import { connectWallet, sendTransaction } from '../utils/web3Utils';
import { useSelector, useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import ErrorModal from './ErrorModal';
import LoadingOverlay from './LoadingOverlay';

const LoanList = () => {
  const [repayLoan, { isLoading: isRepaying, error: repayError }] = useRepayLoanMutation();
  const [isRefetching, setIsRefetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBorrower, setIsBorrower] = useState(true);
  const { data: loans = [], isFetching: isLoadingLoans, error: loansError, refetch: refetchLoans } = useGetLoansQuery(isBorrower);
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
      let publicKey = auth.publicKey || await connectWallet();
      if (!publicKey) throw new Error('Wallet connection failed.');

      dispatch(setPublicKey(publicKey));

      const response = await repayLoan({ loan_id: loanId, amount }).unwrap();
      if (!response || !response.tx) throw new Error('Failed to get repayment transaction data.');

      const transferResult = await sendTransaction(response.tx, publicKey);
      if (!transferResult) throw new Error('Transfer transaction failed.');

      refetchLoans();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to repay loan. Please try again.');
    }
  };

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
          onClick={() => setIsBorrower(true)}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${isBorrower ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Borrowed Loans
        </button>
        <button
          onClick={() => setIsBorrower(false)}
          className={`p-3 transition-all duration-300 text-white font-semibold shadow-md ${!isBorrower ? 'border-b-2 border-blue-600' : 'hover:border-b-2 hover:border-gray-500'}`}
        >
          Lent Loans
        </button>
      </div>
      {isLoadingLoans ? (
        <LoadingOverlay />
      ) : loansError ? (
        <ErrorModal message={loansError.message || 'Failed to load loans. Please try again.'} onClose={() => setErrorMessage('')} />
      ) : loans.length === 0 ? (
        <p className="text-center text-gray-400">No loans found.</p>
      ) : (
        loans.map((loan) => (
          <li
            key={loan.loanId}
            className="flex justify-between items-center bg-gray-800 p-4 m-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 "
          >
            <div className="flex-1">
              <p className="text-xl font-bold text-blue-400">{loan.amount} ETH</p>
              <p className="text-sm text-gray-300">Collateral: {loan.collateral}</p>
              <p className={`text-sm ${loan.status === 'pending' ? 'text-yellow-400' : 'text-green-400'}`}>
                Status: {loan.status}
              </p>
            </div>
            {loan.status === 'Pending' && !isBorrower && (
              <LoanActions loanId={loan.loanId} refetchLoans={refetchLoans} />
            )}
            {loan.status === 'Approved' && isBorrower && (
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
      {errorMessage && <ErrorModal message={errorMessage} onClose={() => setErrorMessage('')} />}
    </div>
  );
};

export default LoanList;
