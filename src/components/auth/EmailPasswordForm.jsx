import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { colors } from "@/styles/colors";

export default function EmailPasswordForm({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  isSigningIn,
  errorMessage,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState({ email: false, password: false });

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    if (email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!password) {
      return;
    }

    onSubmit(e);
  };

  const isFormValid = validateEmail(email) && password.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label
            htmlFor="password"
            className="text-sm font-medium"
            style={{ color: colors.text.primary }}
          >
            Password
          </Label>
          <Link
            to="/forgot-password"
            className="text-xs hover:underline transition-colors"
            style={{ color: colors.primary.main }}
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 pr-10 transition-all"
            style={{
              backgroundColor: colors.background.cream,
              borderColor: touched.password && password ? colors.status.success : colors.ui.borderLight,
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
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            style={{
              borderColor: colors.ui.borderLight,
              backgroundColor: rememberMe ? colors.primary.main : 'transparent',
            }}
          />
          <Label
            htmlFor="remember"
            className="text-sm cursor-pointer select-none"
            style={{ color: colors.text.secondary }}
          >
            Remember me
          </Label>
        </div>
      </div>

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

      <Button
        type="submit"
        disabled={isSigningIn || !isFormValid}
        className="w-full h-11 font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        style={{
          backgroundColor: colors.primary.main,
          color: colors.text.inverted,
        }}
      >
        {isSigningIn ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: colors.ui.borderLight }} />
        </div>
        <div className="relative flex justify-center text-xs">
          <span
            className="px-2"
            style={{ backgroundColor: colors.background.white, color: colors.text.secondary }}
          >
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-medium hover:underline transition-colors"
              style={{ color: colors.primary.main }}
            >
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </form>
  );
}
