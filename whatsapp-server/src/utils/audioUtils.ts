import { getAudioDurationInSeconds } from 'get-audio-duration';
import path from 'path';
import fs from 'fs';

/**
 * Получает длительность аудио файла в секундах
 * @param filePath - путь к аудио файлу
 * @returns длительность в секундах
 */
export const getAudioDuration = async (filePath: string): Promise<number> => {
    try {
        // Проверяем что файл существует
        if (!fs.existsSync(filePath)) {
            console.warn(`Audio file not found: ${filePath}`);
            return 0;
        }

        // Получаем длительность с помощью библиотеки get-audio-duration
        const duration = await getAudioDurationInSeconds(filePath);
        return Math.round(duration);
    } catch (error: any) {
        console.error(`Error getting audio duration for ${filePath}:`, error.message);
        return 0;
    }
};

/**
 * Проверяет является ли файл аудио файлом по расширению
 * @param filePath - путь к файлу
 * @returns true если файл аудио
 */
export const isAudioFile = (filePath: string): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.opus', '.flac'];
    const extension = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(extension);
};

/**
 * Получает MIME тип аудио файла по расширению
 * @param filePath - путь к файлу
 * @returns MIME тип
 */
export const getAudioMimeType = (filePath: string): string => {
    const extension = path.extname(filePath).toLowerCase();
    
    const mimeTypes: { [key: string]: string } = {
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4',
        '.aac': 'audio/aac',
        '.opus': 'audio/opus',
        '.flac': 'audio/flac'
    };

    return mimeTypes[extension] || 'audio/mpeg';
}; 