import React, { useContext, useState, useEffect } from "react";
import { auth } from "../../apis/firebase/config";
import { GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { logger } from "@/utils/logger";


const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isEmailUser, setIsEmailUser] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;

    try {
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          try {
            initializeUser(user);
          } catch (err) {
            logger.error("Error in auth state change:", err);
            setError(err.message);
            setLoading(false);
          }
        },
        (error) => {
          logger.error("Auth state change error:", error);
          setError(error.message);
          setLoading(false);
        }
      );
    } catch (err) {
      logger.error("Error setting up auth listener:", err);
      setError(err.message);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  function initializeUser(user) {
    try {
      if (user) {
        setCurrentUser({ ...user });

        // check if provider is email and password login
        const isEmail = user.providerData && user.providerData.some(
          (provider) => provider.providerId === "password"
        );
        setIsEmailUser(!!isEmail);

        // check if the auth provider is google or not
        const isGoogle = user.providerData && user.providerData.some(
          (provider) => provider.providerId === GoogleAuthProvider.PROVIDER_ID
        );
        setIsGoogleUser(!!isGoogle);

        setUserLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
        setIsEmailUser(false);
        setIsGoogleUser(false);
      }

      setError(null);
      setLoading(false);
    } catch (err) {
      logger.error("Error initializing user:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  // Add logout function
  const logout = async () => {
    try {
      if (!auth) {
        throw new Error("Firebase auth is not initialized");
      }

      await signOut(auth);
      setCurrentUser(null);
      setUserLoggedIn(false);
      setIsEmailUser(false);
      setIsGoogleUser(false);
    } catch (error) {
      logger.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    userLoggedIn,
    isEmailUser,
    isGoogleUser,
    currentUser,
    setCurrentUser,
    logout,
    error
  };

  // If there's an error, show it
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red', backgroundColor: '#fee' }}>
        <h3>Authentication Error:</h3>
        <p>{error}</p>
        <p>Please check your Firebase configuration and try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '10px', padding: '8px 16px' }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}