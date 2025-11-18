import React from 'react';
import { ChatProvider } from '../context/ChatContext';
import WhatsAppContent from '../components/WhatsAppContent';

const WhatsApp: React.FC = () => {
    return (
        <ChatProvider>
            <div className="h-full bg-[#eae6df] dark:bg-gray-900 flex flex-col">
                <WhatsAppContent />
            </div>
        </ChatProvider>
    );
};

export default WhatsApp;