@@ .. @@
 import React, { useState, useRef } from 'react';
 import { Client } from '../types/client';
 import { ClientHeader } from '../components/clients/ClientHeader';
 import { ClientDetails } from '../components/clients/ClientDetails';
-import { ClientFiles } from '../components/clients/ClientFiles';
 
 interface ClientPageProps {
   client: Client;
@@ .. @@
   const [isEditing, setIsEditing] = useState(false);
   const [loading, setLoading] = useState(false);
-  const [showFiles, setShowFiles] = useState(false);
   const detailsRef = useRef<any>(null);
 
   const handleSave = async () => {
@@ .. @@
         setIsEditing={setIsEditing}
         loading={loading}
         handleSave={handleSave}
-        onFilesClick={() => setShowFiles(true)}
       />
       <ClientDetails 
         ref={detailsRef}
         client={client}
         onSave={onSave}
         isEditing={isEditing}
         setIsEditing={setIsEditing}
       />
-      {showFiles && (
-        <ClientFiles
-          client={client}
-          isOpen={showFiles}
-          onClose={() => setShowFiles(false)}
-        />
-      )}
     </div>
   );
 };