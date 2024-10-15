import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFriendsQuery } from '../features/api/apiSlice';
import LoadingOverlay from './LoadingOverlay';
import ErrorModal from './ErrorModal';
import { FaTimesCircle } from 'react-icons/fa'; // Red cross icon
import { motion, AnimatePresence } from 'framer-motion';

const FriendsList = () => {
  const navigate = useNavigate();
  const { data: friends = [], isFetching: isLoading, error } = useGetFriendsQuery();
  const [showError, setShowError] = useState(null);

  useEffect(() => {
    if (error) {
      setShowError(error);
    }
  }, [error]);

  if (isLoading) return <LoadingOverlay />;
  if (showError) return <ErrorModal message={showError.message} onClose={() => setShowError(null)} />;

  return (
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen" >
      <h2 className="text-3xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Your Friends
      </h2>
      <div className="space-y-4">
        {friends.map((friend) => (
          <motion.div
            key={friend._id}
            className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center">
              <span className="font-semibold text-white">{friend.name}</span>
              {!friend.public_key && (
                <FaTimesCircle
                  className="ml-2 text-red-500"
                  title="MetaMask wallet not linked"
                />
              )}
            </div>
            <div className="relative group">
              <button
                disabled={!friend.public_key}
                onClick={() => navigate(`/request-loan/${friend._id}`)}
                className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex items-center transition-all duration-300 ${!friend.public_key && 'cursor-not-allowed opacity-50'}`}
              >
                Request Loan
              </button>
              {!friend.public_key && (
                <div className="absolute -top-8 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded hidden group-hover:block transition-all duration-300 ease-in-out">
                  MetaMask wallet not linked
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
      {showError && <ErrorModal message={showError.message} onClose={() => setShowError(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default FriendsList;
