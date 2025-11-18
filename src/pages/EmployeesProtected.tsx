import React, { useState } from 'react';
import { Employees } from './Employees';
import { PasswordPrompt } from '../components/PasswordPrompt';

export const EmployeesProtected: React.FC = () => {
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

  return <Employees />;
};