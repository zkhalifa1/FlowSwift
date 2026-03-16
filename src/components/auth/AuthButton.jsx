import React from 'react';

const AuthButton = ({ isLoading, children }) => (
  <button
    type="submit"
    disabled={isLoading}
    className={`w-full px-4 py-2 text-white font-medium rounded-lg ${
      isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl transition duration-300'
    }`}
  >
    {isLoading ? 'Signing Up...' : children}
  </button>
);

export default AuthButton;