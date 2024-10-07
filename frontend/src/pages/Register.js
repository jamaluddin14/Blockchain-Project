import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../features/api/apiSlice';
import {  connectWallet } from '../utils/web3Utils'; // Assume this is where your wallet connection logic is
import ErrorModal from '../components/ErrorModal'; // Assume this is the error modal component
import { useSelector,useDispatch } from 'react-redux'; // Import the useSelector hook from react-redux
import {setPublicKey} from '../features/auth/authSlice'; // Import the setPublicKey action creator

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [register,{error:apiError}] = useRegisterMutation();
  const auth = useSelector((state) => state.auth);
  const publicKey = auth.publicKey;
  const dispatch = useDispatch();

  useEffect(() => {
    if (apiError) {
      setError(apiError.message || 'Registration failed');
    }
  }, [apiError]);
  const handleRegister = async () => {
    setIsLoading(true);
    try {
      if (!publicKey) {
        throw new Error('Wallet is not connected');
      }
      await register({ username, password,email, public_key: publicKey });
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Registration failed');
      console.error('Registration failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = async () => {
    try {
      const connectedPublicKey = await connectWallet();
      if (connectedPublicKey) {
        dispatch(setPublicKey(connectedPublicKey));
      } else {
        setError('Failed to connect wallet');
      }
    } catch (error) {
      setError('Error connecting to wallet: ' + error.message);
    }
  };

  const isFormValid = username && password && email && publicKey;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Register</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-4 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 p-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
        />
        <button
          onClick={handleConnectWallet}
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 text-white font-semibold mb-4"
        >
          Connect Wallet
        </button>
        <button
          onClick={handleRegister}
          className={`w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 text-white font-semibold flex items-center justify-center ${
            !isFormValid || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <div className="loader border-t-4 border-b-4 border-white rounded-full w-6 h-6 animate-spin mr-2"></div>
          ) : (
            'Register'
          )}
        </button>
        <p className="mt-4 text-center text-white">
          Already have an account? <a href="/login" className="text-blue-400 hover:underline">Login</a>
        </p>
      </div>

      {/* Error Modal */}
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default RegisterPage;
