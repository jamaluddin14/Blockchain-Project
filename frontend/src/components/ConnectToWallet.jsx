import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setPublicKey } from '../features/auth/authSlice';
import { connectWallet } from '../utils/web3Utils'; // Assuming connectWallet is the async function that returns public_key
import { useAddPublicKeyMutation } from '../features/api/apiSlice';
import ErrorModal from './ErrorModal';
import { useNavigate } from 'react-router-dom';

const AddPublicKey = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addPublicKey, { isError, error: mutationError }] = useAddPublicKeyMutation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isError) {
      setError(mutationError?.data?.detail || 'Failed to add public key');
    }
  }, [isError, mutationError, navigate]);

  const handleConnectWallet = async () => {
    try {
      setLoading(true);
      const publicKey = await connectWallet();

      dispatch(setPublicKey(publicKey));
      await addPublicKey(publicKey).unwrap();
      navigate('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
      <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <h2 className="text-4xl font-bold mb-6 text-center text-green-400">Connect Your Wallet</h2>
        <p className="text-center mb-6 text-gray-300">
          Since it's your first time logging in, connect your wallet to link your public key.
        </p>
        <button
          onClick={handleConnectWallet}
          className={`w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-700 focus:ring-opacity-50 transition-all duration-300 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center space-x-2">
              <div className="loader border-t-4 border-b-4 border-white rounded-full w-6 h-6 animate-spin"></div>
              <span>Connecting...</span>
            </div>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>

      {error && (
        <ErrorModal
          error={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
};

export default AddPublicKey;
