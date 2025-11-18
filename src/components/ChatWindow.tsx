import React, { useState, useRef, useEffect } from 'react';
import { WhatsAppMessage } from '../types/WhatsAppTypes';
import { MdSend, MdAttachFile, MdMic, MdStop } from 'react-icons/md';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
    chat: {
        phoneNumber: string;
        name: string;
        avatarUrl?: string;
        messages: WhatsAppMessage[];
    } | null;
    onSendMessage: (message: string, file?: File) => Promise<void>;
    isMobile: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onSendMessage, isMobile }) => {
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `voice_message_${Date.now()}.webm`, {
                    type: 'audio/webm'
                });
                await onSendMessage('', file);
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Запускаем таймер
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Не удалось получить доступ к микрофону');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);

            // Останавливаем таймер
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
    };

    const handleSend = async () => {
        if (message.trim() || selectedFile) {
            await onSendMessage(message, selectedFile || undefined);
            setMessage('');
            setSelectedFile(null);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chat?.messages]);

    // Очищаем таймер при размонтировании компонента
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-full">
            {/* Область сообщений */}
            <div className="flex-1 overflow-y-auto whatsapp-messages-container whatsapp-messages-list">
                {chat?.messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        message={msg}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Панель ввода */}
            <div className="bg-[#f0f2f5] p-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <MdAttachFile size={24} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Введите сообщение"
                        className="flex-1 rounded-lg px-4 py-2 focus:outline-none"
                        disabled={isRecording}
                    />
                    {!isRecording ? (
                        <>
                            {message.trim() || selectedFile ? (
                                <button
                                    onClick={handleSend}
                                    className="text-[#00a884] hover:text-[#017561]"
                                >
                                    <MdSend size={24} />
                                </button>
                            ) : (
                                <button
                                    onClick={startRecording}
                                    className="text-[#00a884] hover:text-[#017561]"
                                >
                                    <MdMic size={24} />
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-red-500 animate-pulse">
                                {formatDuration(recordingTime)}
                            </span>
                            <button
                                onClick={stopRecording}
                                className="text-red-500 hover:text-red-700"
                            >
                                <MdStop size={24} />
                            </button>
                        </div>
                    )}
                </div>
                {selectedFile && (
                    <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                        <MdAttachFile />
                        <span>{selectedFile.name}</span>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="text-red-500 hover:text-red-700"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;
