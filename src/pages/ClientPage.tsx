import React, { useState, useRef } from 'react';
import { Client } from '../types/client';
import { ClientDetails } from '../components/clients/ClientDetails';
import { ClientFiles } from '../components/clients/ClientFiles';

interface ClientPageProps {
  client: Client;
  onSave: () => void;
  onBack?: () => void;
}

export const ClientPage: React.FC<ClientPageProps> = ({ client, onSave, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const detailsRef = useRef<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientDetails 
        ref={detailsRef}
        client={client}
        onSave={onSave}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        onBack={onBack}
      />
      {showFiles && (
        <ClientFiles
          client={client}
          isOpen={showFiles}
          onClose={() => setShowFiles(false)}
        />
      )}
    </div>
  );
};