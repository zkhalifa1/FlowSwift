import React from 'react';

const AuthError = ({ message }) =>
  message ? <span className="text-red-600 font-bold">{message}</span> : null;

export default AuthError;