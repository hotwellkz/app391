import fs from 'fs';
import path from 'path';
import { getAudioDuration } from './audioUtils';

const uploadsDir = path.join(__dirname, '../../uploads');

interface MediaFile {
    url: string;
    fileName: string;
    fileSize: number;
    duration?: number;
}

export const downloadMedia = async (media: any): Promise<MediaFile> => {
    try {
        // Создаем директорию, если она не существует
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Генерируем имя файла
        const fileName = `${Date.now()}_${media.filename || 'media'}`;
        const filePath = path.join(uploadsDir, fileName);

        // Если передан URL, скачиваем файл
        if (media.url) {
            const response = await fetch(media.url);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(filePath, Buffer.from(buffer));
        }
        // Если передан base64, сохраняем его
        else if (media.data) {
            const buffer = Buffer.from(media.data, 'base64');
            fs.writeFileSync(filePath, buffer);
        }

        const stats = fs.statSync(filePath);
        let duration = 0;

        // Если это аудио, получаем длительность
        if (media.mimetype?.startsWith('audio/')) {
            duration = await getAudioDuration(filePath);
        }

        return {
            url: `/uploads/${fileName}`,
            fileName,
            fileSize: stats.size,
            duration
        };
    } catch (error: any) {
        console.error('Error downloading media:', error);
        throw error;
    }
};
