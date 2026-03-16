import React from 'react'

const GoogleSignInButton = ({ onClick, isSigningIn }) => {
    return (
        <button
            disabled={isSigningIn}
            onClick={onClick}
            className={`w-full flex items-center justify-center gap-x-3 py-2.5 border rounded-lg text-sm font-medium ${isSigningIn ? 'cursor-not-allowed' : 'hover:bg-gray-100 transition duration-300 active:bg-gray-100'}`}>
            <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none">
                <g clipPath="url(#clip0_17_40)">
                    <path d="M47.532..." fill="#4285F4" />
                    <path d="M24.48..." fill="#34A853" />
                    <path d="M11.0051..." fill="#FBBC04" />
                    <path d="M24.48..." fill="#EA4335" />
                </g>
                <defs>
                    <clipPath id="clip0_17_40">
                        <rect width="48" height="48" fill="white" />
                    </clipPath>
                </defs>
            </svg>
            {isSigningIn ? 'Signing In...' : 'Continue with Google'}
        </button>
    )
}

export default GoogleSignInButton