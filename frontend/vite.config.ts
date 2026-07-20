import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'next/navigation': path.resolve(__dirname, './src/lib/next-navigation-compat.ts'),
        'next/link': path.resolve(__dirname, './src/lib/next-link-compat.tsx'),
        'next/image': path.resolve(__dirname, './src/lib/next-image-compat.tsx'),
      },
    },
    define: {
      'process.env': {
        NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
        NEXT_PUBLIC_SOCKET_URL: env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001',
        NEXT_PUBLIC_RAZORPAY_KEY_ID: env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_razorpay_key_id_here',
        NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        NODE_ENV: JSON.stringify(mode),
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
