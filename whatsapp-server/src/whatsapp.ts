import { Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import { Server } from 'socket.io';
import { addMessage } from './utils/chatStorage';
import { ChatMessage } from './types/chat';
import qrcode from 'qrcode';
import { downloadMedia } from './utils/mediaUtils';
import fs from 'fs';

let client: Client;
let io: Server;

export const initializeWhatsApp = async (socketIO: Server): Promise<void> => {
    io = socketIO;

    client = new Client({
        authStrategy: new LocalAuth({
            clientId: 'whatsapp-client',
            dataPath: process.env.WHATSAPP_SESSION_PATH || '/app/data/.wwebjs_auth'
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--virtual-time-budget=5000',
                '--run-all-compositor-stages-before-draw',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-default-browser-check',
                '--autoplay-policy=user-gesture-required',
                '--disable-background-mode'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            timeout: 60000,
            defaultViewport: null,
            devtools: false,
            ignoreDefaultArgs: ['--disable-extensions'],
            handleSIGINT: false,
            handleSIGTERM: false,
            handleSIGHUP: false
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
        takeoverOnConflict: true,
        takeoverTimeoutMs: 30000
    });

    client.on('qr', async (qr) => {
        try {
            console.log('QR Code received');
            const qrCode = await qrcode.toDataURL(qr);
            io.emit('qr', qrCode);
            console.log('QR Code sent to client');
        } catch (error: any) {
            console.error('Error generating QR code:', error);
        }
    });

    client.on('ready', () => {
        console.log('WhatsApp client is ready!');
        io.emit('ready');
    });

    client.on('message', async (msg: Message) => {
        try {
            console.log('Received message details:', {
                id: msg.id.id,
                from: msg.from,
                to: msg.to,
                body: msg.body,
                hasMedia: msg.hasMedia,
                timestamp: msg.timestamp
            });

            let mediaUrl = '';
            let mediaType = '';
            let fileName = '';
            let fileSize = 0;
            let duration = 0;
            let isVoiceMessage = false;

            // Обработка медиафайлов
            if (msg.hasMedia) {
                try {
                    const media = await msg.downloadMedia();
                    if (media) {
                        const savedMedia = await downloadMedia(media);
                        mediaUrl = savedMedia.url;
                        mediaType = media.mimetype;
                        fileName = savedMedia.fileName;
                        fileSize = savedMedia.fileSize;
                        duration = savedMedia.duration || 0;
                        isVoiceMessage = msg.type === 'ptt' || media.mimetype.startsWith('audio/');
                    }
                } catch (error) {
                    console.error('Error downloading media:', error);
                }
            }

            // Создаем объект сообщения
            const chatMessage: ChatMessage = {
                id: msg.id.id,
                body: msg.body,
                from: msg.from,
                to: msg.to,
                timestamp: msg.timestamp.toString(),
                fromMe: msg.fromMe,
                hasMedia: msg.hasMedia,
                mediaUrl,
                mediaType,
                fileName,
                fileSize,
                isVoiceMessage,
                duration
            };

            // Добавляем сообщение в хранилище
            const chat = await addMessage(chatMessage);

            // Отправляем сообщение всем подключенным клиентам
            io.emit('whatsapp-message', chatMessage);
            io.emit('chat-updated', chat);

            console.log('Message processed and sent to clients');
        } catch (error: any) {
            console.error('Error processing incoming message:', error);
        }
    });

    client.on('disconnected', () => {
        console.log('Client disconnected');
        io.emit('disconnected');
    });

    try {
        await client.initialize();
        console.log('WhatsApp client initialized');
    } catch (error: any) {
        console.error('Error initializing WhatsApp client:', error);
        throw error;
    }
};

export const sendMessage = async (
    to: string,
    message: string,
    mediaUrl?: string
): Promise<ChatMessage | null> => {
    try {
        if (!client) {
            throw new Error('WhatsApp client not initialized');
        }

        let msg: Message;

        if (mediaUrl) {
            // Отправка медиафайла
            try {
                // Читаем файл и создаем MessageMedia объект
                const filePath = mediaUrl.startsWith('http') ? mediaUrl : `./uploads/${mediaUrl}`;
                
                if (mediaUrl.startsWith('http')) {
                    // Для HTTP URL скачиваем файл
                    const mediaFile = await downloadMedia({ url: mediaUrl });
                    const fullPath = `./uploads/${mediaFile.fileName}`;
                    const data = fs.readFileSync(fullPath, { encoding: 'base64' });
                    const media = new MessageMedia('application/octet-stream', data, mediaFile.fileName);
                    msg = await client.sendMessage(to, media);
                } else {
                    // Для локальных файлов читаем напрямую
                    const data = fs.readFileSync(filePath, { encoding: 'base64' });
                    const media = new MessageMedia('application/octet-stream', data);
                    msg = await client.sendMessage(to, media);
                }
            } catch (error) {
                console.error('Error sending media message:', error);
                throw new Error('Failed to send media message');
            }
        } else {
            // Отправка текстового сообщения
            msg = await client.sendMessage(to, message);
        }

        // Создаем объект сообщения
        const chatMessage: ChatMessage = {
            id: msg.id.id,
            body: message,
            from: msg.from,
            to: msg.to,
            timestamp: new Date().toISOString(),
            fromMe: true,
            hasMedia: !!mediaUrl,
            mediaUrl: mediaUrl || '',
            mediaType: '',
            fileName: '',
            fileSize: 0,
            isVoiceMessage: false,
            duration: 0
        };

        return chatMessage;
    } catch (error: any) {
        console.error('Error sending message:', error);
        return null;
    }
};
