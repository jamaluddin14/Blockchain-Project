import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAddFriendMutation, useSearchFriendsQuery, useGetTopScorersQuery } from "../features/api/apiSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserPlus, faTimesCircle, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import LoadingOverlay from "./LoadingOverlay";
import ErrorModal from "./ErrorModal";

const AddFriend = () => {
  const [searchQuery, setSearchQuery] = useState("");
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
    <div className="p-4 md:p-6 bg-gray-900 text-gray-100 min-h-screen">
      <h2 className="text-3xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Add Friend
      </h2>

      <input
        type="text"
        placeholder="Search for friends..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-3 rounded bg-gray-700 text-white w-full placeholder-gray-400"
      />

      {error && (
        <ErrorModal error={error} onClose={() => setError(null)} />
      )}

      {isLoading && <LoadingOverlay />}

      <div className="space-y-4">
        {(searchQuery ? searchResults : topScorers).map((user) => (
          <motion.div
            key={user.id}
            className="p-4 bg-gray-800 rounded-lg flex justify-between items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <span className="font-semibold text-white">{user.name}</span>
            <button
              onClick={() => handleAddFriend(user.id)}
              disabled={loadingFriendId === user.id}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full flex items-center"
            >
              {loadingFriendId === user.id ? (
                <div className="loader border-t-4 border-b-4 border-white rounded-full w-6 h-6 animate-spin mr-2"></div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                  Add Friend
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {error && <ErrorModal error={error} onClose={() => setError(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default AddFriend;
