import React, { useEffect, useState } from 'react';
import { useAddFriendMutation, useSearchFriendsQuery, useGetTopScorersQuery } from '../features/api/apiSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faTimesCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import LoadingOverlay from './LoadingOverlay';
import ErrorModal from './ErrorModal';

const AddFriend = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFriendId, setLoadingFriendId] = useState(null);
  const [addFriend] = useAddFriendMutation();
  const { data: searchResults = [], isLoading: isSearching, error: searchError } = useSearchFriendsQuery(searchQuery, { skip: !searchQuery });
  const { data: topScorers = [], isLoading: isLoadingTopScorers, error: topScorerError } = useGetTopScorersQuery();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchError) {
      setError("Error searching for friends");
    }
    if (topScorerError) {
      setError("Error fetching friend suggestions");
    }
  }, [searchError, topScorerError]);

  const handleAddFriend = async (friendId) => {
    setLoadingFriendId(friendId);

    try {
      await addFriend(friendId).unwrap();
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFriendId(null);
    }
  };

  const isLoading = isSearching || isLoadingTopScorers;

  return (
    <div className="relative p-6 bg-gradient-to-b from-gray-800 to-gray-900 shadow-xl rounded-lg">
      <h3 className="text-3xl font-bold mb-6 text-white">Add Friend</h3>
      <input
        type="text"
        placeholder="Search friends..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-3 rounded bg-gray-700 text-white w-full placeholder-gray-400"
      />
      {error && <ErrorModal message={error} onClose={() => setError(null)} />}
      {isLoading && <LoadingOverlay />}
      <ul className="space-y-4">
        {(searchQuery ? searchResults : topScorers).map((user) => (
          <li key={user._id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md text-white hover:bg-gray-700 transition-all duration-300">
            <div className="flex items-center">
              <span className="mr-2">{user.name}</span>
              {user.public_key ? (
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" title="User verified" />
              ) : (
                <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" title="User not verified" />
              )}
            </div>
            <button
              onClick={() => handleAddFriend(user._id)}
              className="p-2 bg-green-600 hover:bg-green-700 rounded-md flex items-center text-sm font-semibold transition-all duration-300"
              disabled={loadingFriendId === user._id}
            >
              {loadingFriendId === user._id ? (
                <div className="loader border-t-4 border-b-4 border-white rounded-full w-4 h-4 animate-spin mr-2"></div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" /> Add Friend
                </>
              )}
            </button>
          </li>
        ))}
        {(!searchResults.length && searchQuery) && <p className="text-gray-400 text-center">No results found.</p>}
        {(!topScorers.length && !searchQuery) && <p className="text-gray-400 text-center">No top scorers available.</p>}
      </ul>
    </div>
  );
};

export default AddFriend;
