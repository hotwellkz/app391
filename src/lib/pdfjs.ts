import * as pdfjsLib from 'pdfjs-dist';

// Используем встроенный worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const pdfjs = pdfjsLib;
