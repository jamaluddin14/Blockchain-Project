import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFriendsQuery } from '../features/api/apiSlice';
import LoadingOverlay from './LoadingOverlay';
import ErrorModal from './ErrorModal';
import { FaTimesCircle } from 'react-icons/fa'; // Red cross icon

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
    <div className="p-6 bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl rounded-lg">
      <h3 className="text-3xl font-bold mb-6 text-white">Your Friends</h3>
      <ul className="space-y-4">
        {friends.map((friend) => (
          <li key={friend._id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md text-white hover:bg-gray-700 transition-all duration-300">
            <div className="flex items-center">
              {friend.name}
              {!friend.public_key && (
                <FaTimesCircle className="ml-2 text-red-500" title="MetaMask wallet not linked" />
              )}
            </div>
            <div className="relative group">
              <button
                disabled={!friend.public_key}
                onClick={() => navigate(`/request-loan/${friend._id}`)}
                className={`p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition-all duration-300 ${!friend.public_key && 'cursor-not-allowed'}`}
              >
                Request Loan
              </button>
              {!friend.public_key && (
                <div className="absolute -top-8 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded hidden group-hover:block">
                  The friend has not linked their MetaMask wallet yet
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsList;
