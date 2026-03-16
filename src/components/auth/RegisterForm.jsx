import React, { useState, useEffect } from 'react';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import AuthError from './AuthError';
import { Link } from 'react-router-dom';
import { validatePassword, getPasswordStrengthLabel, getRequirementsStatus } from '@/utils/passwordValidator';

const RegisterForm = ({
  email,
  password,
  confirmPassword,
  setEmail,
  setPassword,
  setConfirmPassword,
  onSubmit,
  isRegistering,
  errorMessage,
}) => {
  const [passwordValidation, setPasswordValidation] = useState(null);
  const [showRequirements, setShowRequirements] = useState(false);
  const [touched, setTouched] = useState(false);

  // Validate password whenever it changes
  useEffect(() => {
    if (password) {
      setPasswordValidation(validatePassword(password));
    } else {
      setPasswordValidation(null);
    }
  }, [password]);

  const handlePasswordFocus = () => {
    setShowRequirements(true);
  };

  const handlePasswordBlur = () => {
    setTouched(true);
    // Keep requirements visible if there are errors
    if (passwordValidation && !passwordValidation.isValid) {
      setShowRequirements(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);

    // Validate password before submit
    if (passwordValidation && !passwordValidation.isValid) {
      return;
    }

    onSubmit(e);
  };

  const requirements = password ? getRequirementsStatus(password) : [];
  const strengthInfo = passwordValidation ? getPasswordStrengthLabel(passwordValidation.strength) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />

      <div>
        <AuthInput
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={handlePasswordFocus}
          onBlur={handlePasswordBlur}
          autoComplete="new-password"
          disabled={isRegistering}
        />

        {/* Password Strength Meter */}
        {password && passwordValidation && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-zinc-400">Password strength:</span>
              <span className={`text-xs font-medium ${strengthInfo.class}`}>
                {strengthInfo.label}
              </span>
            </div>
            <div className="w-full bg-zinc-700 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${strengthInfo.bgClass}`}
                style={{ width: `${passwordValidation.strength}%` }}
              />
            </div>
          </div>
        )}

        {/* Password Requirements */}
        {showRequirements && password && (
          <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-xs font-medium text-zinc-300 mb-2">Password must have:</p>
            <ul className="space-y-1.5">
              {requirements.map((req, index) => (
                <li
                  key={index}
                  className={`text-xs flex items-center gap-2 transition-colors ${
                    req.met ? 'text-green-400' : 'text-zinc-500'
                  }`}
                >
                  <span className="text-sm">{req.met ? '✓' : '○'}</span>
                  {req.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Errors */}
        {touched && passwordValidation && !passwordValidation.isValid && (
          <div className="mt-2 text-xs text-red-400">
            {passwordValidation.errors.slice(0, 2).map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        )}
      </div>

      <AuthInput
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="off"
        disabled={isRegistering}
      />

      <AuthError message={errorMessage} />
      <AuthButton
        isLoading={isRegistering}
        disabled={isRegistering || (touched && passwordValidation && !passwordValidation.isValid)}
      >
        Sign Up
      </AuthButton>

      <div className="text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="font-bold hover:underline">
          Continue
        </Link>
      </div>
    </form>
  );
};

export default RegisterForm;