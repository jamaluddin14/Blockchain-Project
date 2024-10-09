import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useRequestLoanMutation, useAddPublicKeyMutation } from '../features/api/apiSlice';
import { sendTransaction, connectWallet, checkIfWalletIsConnected } from '../utils/web3Utils';
import ErrorModal from './ErrorModal';
import { setPublicKey } from '../features/auth/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import DatePicker from 'react-datepicker'; // Import DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // Import DatePicker CSS

const LoanRequestForm = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [collateral, setCollateral] = useState('');
  const [dueDate, setDueDate] = useState(new Date()); // State for due date
  const [error, setError] = useState(null);
  const [requestLoan, { isLoading }] = useRequestLoanMutation();
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { friendId } = useParams();
  const [addPublicKey] = useAddPublicKeyMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await requestLoan({
        lender_id: friendId,
        amount,
        collateral,
        due_date: dueDate.toISOString() // Send the due date
      }).unwrap();

      if (!response || !response.tx) throw new Error('No transaction hash received from API.');

      let publicKey = auth.publicKey;
      if (!publicKey) {
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));
        addPublicKey(publicKey);
      } else {
        await checkIfWalletIsConnected(publicKey);
      }
      await sendTransaction(response.tx, publicKey);
      navigate('/');
    } catch (error) {
      setError(error.message || 'An error occurred while requesting the loan.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-800 via-gray-900 to-black p-6">
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-lg w-full relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 text-white text-lg hover:text-blue-400 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>

        {/* Form Title */}
        <h3 className="text-3xl font-semibold text-center mb-6 text-white">Request Loan</h3>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-white mb-2" htmlFor="amount">
              Loan Amount
            </label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter loan amount"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2" htmlFor="collateral">
              Collateral
            </label>
            <input
              type="text"
              id="collateral"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter collateral"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2" htmlFor="dueDate">
              Due Date
            </label>
            <DatePicker
              selected={dueDate}
              onChange={(date) => setDueDate(date)}
              className="w-full p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              minDate={new Date()} // Disable past dates
              placeholderText="Select due date"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`p-3 w-full bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-bold transition-all ${
              (!amount || !collateral || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!amount || !collateral || isLoading}
          >
            {isLoading ? (
              <div className="loader border-t-4 border-b-4 border-white rounded-full w-4 h-4 animate-spin mx-auto"></div>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>

        {/* Error Modal */}
        {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      </div>
    </div>
  );
};

export default LoanRequestForm;
