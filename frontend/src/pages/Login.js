import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../features/api/apiSlice';
import { useDispatch,useSelector } from 'react-redux';
import { setToken, setEmail, setId,setPublicKey} from '../features/auth/authSlice';
import ErrorModal from '../components/ErrorModal'; // Adjust the path as necessary
import { connectWallet } from '../utils/web3Utils'; // Adjust the import path
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // State for handling errors
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login] = useLoginMutation();
  const auth=useSelector((state)=>state.auth);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null); // Reset error state

    try {
      let publicKey;
        if(!auth.publicKey){    
        publicKey = await connectWallet();
        dispatch(setPublicKey(publicKey));
        }else{
            publicKey=auth.publicKey;
        }
      // Call the login API with username, password, and public key
      const { data } = await login({ username, password, public_key:publicKey });
      console.log(publicKey);
      dispatch(setEmail(data.email));
      dispatch(setId(data._id));
      dispatch(setToken(data.access_token));
      
      navigate('/');
    } catch (error) {
      console.error('Login failed', error);
      setError('Login failed. Please try again.'); // Set error message
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username && password;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Login</h2>
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
        <button
          onClick={handleLogin}
          className={`w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-300 text-white font-semibold flex items-center justify-center ${
            !isFormValid || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <div className="loader border-t-4 border-b-4 border-white rounded-full w-6 h-6 animate-spin mr-2"></div>
          ) : (
            'Login'
          )}
        </button>
        <p className="mt-4 text-center text-white">
          Don't have an account? <a href="/register" className="text-blue-400 hover:underline">Register</a>
        </p>
      </div>
      
      {/* ErrorModal to display errors if any */}
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
    </div>
  );
};

export default LoginPage;
