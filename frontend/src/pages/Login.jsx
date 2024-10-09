import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuthData } from '../features/auth/authSlice';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import { logIn, signInWithGoogle, signInWithFacebook } from '../firebase';
import { useLoginMutation, useVerifyOrRegisterMutation } from '../features/api/apiSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [login] = useLoginMutation();
  const [verifyOrRegister] = useVerifyOrRegisterMutation();
  
  // State to hold user data for login or verification
  const [userToVerify, setUserToVerify] = useState({
    id: null,
    name: null,
    email: null,
  });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const firebaseUser = await logIn(email, password);
      // Proceed with login using the UID after verification or registration
      const {user}=firebaseUser;
      const userLoginResponse = await login({ uuid: user.uid }).unwrap();

      dispatch(
        setAuthData({
          email: firebaseUser.email,
          id: firebaseUser.uid,
          username: firebaseUser.displayName,
          token: userLoginResponse.access_token,
          publicKey:userLoginResponse.user.public_key
        })
      );
      navigate('/'); // Navigate to dashboard
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  };

  const handleSocialLogin = async (socialLoginFunction) => {
    try {
      const response = await socialLoginFunction();
      const { user } = response;

      // Set user UID for verification
      setUserToVerify({ id: user.uid, name: user.displayName || user.fullName, email: user.email });

      // Trigger verifyOrRegister mutation
      const verifyOrRegisterResponse = await verifyOrRegister({
        uuid: user.uid,
        email: user.email,
        name: user.displayName || user.fullName,
      }).unwrap();

      // Proceed with login after verification or registration
      const userLoginResponse = await login({ uuid: user.uid }).unwrap();

      dispatch(
        setAuthData({
          email: user.email,
          id: user.uid,
          username: user.displayName || user.fullName,
          token: userLoginResponse.access_token,
          publicKey:userLoginResponse.user.public_key
        })
      );
      
      navigate('/'); // Navigate to dashboard
    } catch (error) {
      console.error(error.message);
      alert(error.message);
    }
  };

  const handleGoogleLogin = () => handleSocialLogin(signInWithGoogle);
  const handleFacebookLogin = () => handleSocialLogin(signInWithFacebook);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-2 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-2 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-700"
          >
            Login with Email
          </button>
        </form>

        <hr className="my-6 border-gray-600" />

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
          >
            <FaGoogle className="w-5 h-5" />
            <span>Login with Google</span>
          </button>

          <button
            onClick={handleFacebookLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
          >
            <FaFacebook className="w-5 h-5" />
            <span>Login with Facebook</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
