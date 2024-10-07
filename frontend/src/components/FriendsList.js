import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetFriendsQuery } from '../features/api/apiSlice';
import LoadingOverlay from './LoadingOverlay';
import ErrorModal from './ErrorModal';

const FriendsList = () => {
  const navigate = useNavigate();
  const { data: friends = [], isFetching:isLoading, error } = useGetFriendsQuery();
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
            {friend.username}
            <button
              onClick={() => navigate(`/request-loan/${friend._id}`)}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-semibold transition-all duration-300"
            >
              Request Loan
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendsList;
