import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    exclude: ['whatsapp-web.js'],
    include: [
      'react',
      'react-dom',
      'firebase/firestore',
      'firebase/auth',
      'firebase/storage',
      'lucide-react',
      'date-fns',
      'clsx'
    ]
  },
  build: {
    commonjsOptions: {
      exclude: ['whatsapp-web.js']
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React и основные библиотеки
          vendor: ['react', 'react-dom'],
          
          // Firebase
          firebase: [
            'firebase/app',
            'firebase/firestore', 
            'firebase/auth',
            'firebase/storage'
          ],
          
          // UI библиотеки
          ui: [
            'lucide-react',
            '@headlessui/react',
            'react-custom-scrollbars-2'
          ],
          
          // Утилиты
          utils: [
            'date-fns',
            'clsx',
            'react-router-dom'
          ],
          
          // Тяжёлые библиотеки
          heavy: [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            'react-swipeable',
            'framer-motion'
          ],
          
          // Редакторы и формы
          editors: [
            '@tiptap/react',
            '@tiptap/starter-kit',
            'react-quill'
          ]
        }
      }
    },
    
    // Увеличиваем лимит для предупреждений о размере чанков
    chunkSizeWarningLimit: 1000,
    
    // Используем встроенную минификацию esbuild вместо terser
    minify: 'esbuild',
    
    // Sourcemaps только для development
    sourcemap: process.env.NODE_ENV === 'development',
  },
  server: {
    host: true,
    port: 5173
  }
});
