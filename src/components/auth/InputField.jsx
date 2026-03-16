import React from 'react'

const InputField = ({ label, type, value, onChange, autoComplete }) => (
    <div>
        <label className="text-sm text-gray-600 font-bold">{label}</label>
        <input
            type={type}
            autoComplete={autoComplete}
            required
            value={value}
            onChange={onChange}
            className="w-full mt-2 px-3 py-2 text-gray-500 bg-transparent outline-none border focus:border-indigo-600 shadow-sm rounded-lg transition duration-300"
        />
    </div>
)

export default InputField