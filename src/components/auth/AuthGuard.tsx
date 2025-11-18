import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase/auth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { LoadingSpinner } from '../LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm
        onSuccess={() => setIsAuthenticated(true)}
        onLoginClick={() => setShowRegister(false)}
      />
    ) : (
      <LoginForm
        onSuccess={() => setIsAuthenticated(true)}
        onRegisterClick={() => setShowRegister(true)}
      />
    );
  }

  return <>{children}</>;
};