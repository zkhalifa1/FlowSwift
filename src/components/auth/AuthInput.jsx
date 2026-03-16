import React from 'react';

const AuthInput = ({ label, type = 'text', value, onChange, disabled, autoComplete }) => (
  <div>
    <label className="text-sm text-gray-600 font-bold">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete={autoComplete}
      required
      className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
    />
  </div>
);

export default AuthInput;