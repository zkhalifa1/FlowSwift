import { Card, CardContent } from "@/components/ui/card";
import AuthProviders from "../components/auth/AuthProviders";
import EmailPasswordForm from "../components/auth/EmailPasswordForm";
import LogoHeader from "../components/auth/LogoHeader";
import LoginFooter from "../components/auth/LoginFooter";
import {useAuth} from "../contexts/authContext/index.jsx";
import React, {useState} from "react";
import {doSignInWithEmailAndPassword, doSignInWithGoogle} from "../apis/firebase/auth.js";
import {Navigate} from "react-router-dom";
import { colors } from "@/styles/colors";

export default function LoginPage() {
    const { userLoggedIn } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const onSubmit = async (e) => {
        e.preventDefault()
        if (!isSigningIn) {
            setIsSigningIn(true)
            setErrorMessage('')
            try {
                await doSignInWithEmailAndPassword(email, password)
            } catch (err) {
                setErrorMessage(err.message)
                setIsSigningIn(false)
            }
        }
    }

    const onGoogleSignIn = async (e) => {
        e.preventDefault()
        if (!isSigningIn) {
            setIsSigningIn(true)
            setErrorMessage('')
            try {
                await doSignInWithGoogle()
            } catch (err) {
                setErrorMessage(err.message)
                setIsSigningIn(false)
            }
        }
    }

    if (userLoggedIn) return <Navigate to="/dashboard" replace />

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
            <LogoHeader />
            <CardContent className="space-y-6 px-8 pb-8">
              <AuthProviders onGoogleSignIn={onGoogleSignIn}/>
              <EmailPasswordForm
                onSubmit={onSubmit}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                isSigningIn={isSigningIn}
                errorMessage={errorMessage}
              />
            </CardContent>
          </Card>
          <LoginFooter />
        </div>
      </div>
    );
}
