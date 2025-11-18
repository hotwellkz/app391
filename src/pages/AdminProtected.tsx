import React, { useState } from 'react';
import { Admin } from './Admin';
import { PasswordPrompt } from '../components/PasswordPrompt';

export const AdminProtected: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <PasswordPrompt
        isOpen={true}
        onClose={() => window.history.back()}
        onSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return <Admin />;
};