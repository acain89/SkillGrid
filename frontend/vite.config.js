import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/server.crt')),
    },
    host: true,
    port: 5173,
  },
});
