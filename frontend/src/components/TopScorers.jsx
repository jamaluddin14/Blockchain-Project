import React from 'react';
import { useGetTopScorersQuery } from '../features/api/apiSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const TopScorers = () => {
  const { data: topScorers = [], isFetching: isLoading, error } = useGetTopScorersQuery();

  if (isLoading) return <div>Loading top scorers...</div>;
  if (error) return <div>Error loading top scorers: {error.message}</div>;

  return (
    <div className="p-6 bg-gray-900 shadow-lg rounded-lg">
      <h3 className="text-2xl font-bold mb-4 text-white">Top Scorers</h3>
      <ul>
        {topScorers.map((scorer) => (
          <li key={scorer.id} className="bg-gray-700 p-3 rounded-lg mb-2 text-white shadow-md flex items-center">
            <span className="mr-2">{scorer.name}</span>
            {scorer.public_key ? (
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500" title="User verified" />
            ) : (
              <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" title="User not verified" />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopScorers;
