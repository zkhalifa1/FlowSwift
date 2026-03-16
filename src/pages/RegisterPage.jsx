import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { doCreateUserWithEmailAndPassword, doSignInWithGoogle } from '../apis/firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";
import LoginFooter from "../components/auth/LoginFooter";
import { colors } from "@/styles/colors";

const Register = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 8;
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email && value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password && value && !validatePassword(value)) {
      setPasswordError("Password must be at least 8 characters");
    } else {
      setPasswordError("");
    }
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    if (password && !validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPassword: true });
    setErrorMessage('');

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (!agreeToTerms) {
      setErrorMessage('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    try {
      setIsRegistering(true);
      await doCreateUserWithEmailAndPassword(email, password);
    } catch (err) {
      setErrorMessage(err.message);
      setIsRegistering(false);
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (!isRegistering) {
      setIsRegistering(true);
      setErrorMessage('');
      try {
        await doSignInWithGoogle();
      } catch (err) {
        setErrorMessage(err.message);
        setIsRegistering(false);
      }
    }
  };

  const isFormValid = validateEmail(email) && validatePassword(password) && password === confirmPassword && agreeToTerms;

  if (userLoggedIn) return <Navigate to="/dashboard" replace={true} />;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: colors.background.cream }}
    >
      <div className="w-full max-w-md">
        <Card
          className="w-full border shadow-lg"
          style={{
            backgroundColor: colors.background.white,
            borderColor: colors.ui.borderLight,
          }}
        >
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center mb-2">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: colors.primary.main }}
              >
                <span className="text-white font-bold text-2xl">FS</span>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle
                className="text-3xl font-bold tracking-tight"
                style={{ color: colors.text.primary }}
              >
                Create Your Account
              </CardTitle>
              <CardDescription
                className="text-base"
                style={{ color: colors.text.secondary }}
              >
                Join Flow Swift and start creating reports with AI
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-8 pb-8">
            {/* Google Sign Up */}
            <Button
              variant="outline"
              onClick={onGoogleSignIn}
              type="button"
              disabled={isRegistering}
              className="w-full h-11 flex items-center justify-center gap-3 font-medium transition-all shadow-sm hover:shadow"
              style={{
                backgroundColor: colors.background.white,
                color: colors.text.primary,
                borderColor: colors.ui.borderLight,
              }}
            >
              <FcGoogle size={20} />
              Continue with Google
            </Button>

            <div className="flex items-center my-6">
              <Separator className="flex-1" style={{ backgroundColor: colors.ui.borderLight }} />
              <span
                className="px-4 text-xs font-medium uppercase tracking-wider"
                style={{ color: colors.text.tertiary }}
              >
                Or sign up with email
              </span>
              <Separator className="flex-1" style={{ backgroundColor: colors.ui.borderLight }} />
            </div>

            {/* Registration Form */}
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className="h-11 pr-10 transition-all"
                    style={{
                      backgroundColor: colors.background.cream,
                      borderColor: emailError ? colors.status.error : (touched.email && !emailError && email ? colors.status.success : colors.ui.borderLight),
                      color: colors.text.primary,
                    }}
                  />
                  {touched.email && email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailError ? (
                        <AlertCircle className="h-4 w-4" style={{ color: colors.status.error }} />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" style={{ color: colors.status.success }} />
                      )}
                    </div>
                  )}
                </div>
                {emailError && (
                  <p
                    id="email-error"
                    className="text-xs flex items-center gap-1"
                    style={{ color: colors.status.error }}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    required
                    className="h-11 pr-10 transition-all"
                    style={{
                      backgroundColor: colors.background.cream,
                      borderColor: passwordError ? colors.status.error : (touched.password && !passwordError && password ? colors.status.success : colors.ui.borderLight),
                      color: colors.text.primary,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: colors.text.secondary }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: colors.status.error }}
                  >
                    <AlertCircle className="h-3 w-3" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                  style={{ color: colors.text.primary }}
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 pr-10 transition-all"
                    style={{
                      backgroundColor: colors.background.cream,
                      borderColor: touched.confirmPassword && confirmPassword && password !== confirmPassword
                        ? colors.status.error
                        : (touched.confirmPassword && confirmPassword && password === confirmPassword
                          ? colors.status.success
                          : colors.ui.borderLight),
                      color: colors.text.primary,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: colors.text.secondary }}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {touched.confirmPassword && confirmPassword && password !== confirmPassword && (
                  <p
                    className="text-xs flex items-center gap-1"
                    style={{ color: colors.status.error }}
                  >
                    <AlertCircle className="h-3 w-3" />
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={setAgreeToTerms}
                  className="mt-1"
                  style={{
                    borderColor: colors.ui.borderLight,
                    backgroundColor: agreeToTerms ? colors.primary.main : 'transparent',
                  }}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm cursor-pointer select-none leading-tight"
                  style={{ color: colors.text.secondary }}
                >
                  I agree to the{" "}
                  <Link
                    to="/terms"
                    className="underline hover:opacity-80"
                    style={{ color: colors.primary.main }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="underline hover:opacity-80"
                    style={{ color: colors.primary.main }}
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div
                  className="rounded-lg p-3 flex items-start gap-2"
                  style={{
                    backgroundColor: `${colors.status.error}10`,
                    border: `1px solid ${colors.status.error}50`,
                  }}
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.status.error }} />
                  <p className="text-sm" style={{ color: colors.status.error }}>{errorMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isRegistering || !isFormValid}
                className="w-full h-11 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                style={{
                  backgroundColor: colors.primary.main,
                  color: colors.text.inverted,
                }}
              >
                {isRegistering ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Login Link */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: colors.ui.borderLight }} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span
                    className="px-2"
                    style={{ backgroundColor: colors.background.white, color: colors.text.secondary }}
                  >
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium hover:underline transition-colors"
                      style={{ color: colors.primary.main }}
                    >
                      Sign in
                    </Link>
                  </span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
        <LoginFooter />
      </div>
    </div>
  );
};

export default Register;