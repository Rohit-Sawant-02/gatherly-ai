import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import chatHandler from './api/chat.js';
import healthHandler from './api/health.js';

function geminiDevApiPlugin(env) {
  return {
    name: 'gemini-dev-api-middleware',
    configureServer(server) {
      // Ensure server process environment has the secrets loaded from .env
      if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      }
      if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) {
        process.env.GEMINI_MODEL = env.GEMINI_MODEL;
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/health' && req.method === 'GET') {
          return healthHandler(req, res);
        }

        if (url === '/api/chat') {
          if (req.method === 'POST') {
            let bodyData = '';
            req.on('data', chunk => {
              bodyData += chunk;
              if (bodyData.length > 64 * 1024) {
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Payload too large.' }));
                req.destroy();
              }
            });
            req.on('end', async () => {
              try {
                req.body = bodyData ? JSON.parse(bodyData) : {};
              } catch {
                req.body = bodyData;
              }
              await chatHandler(req, res);
            });
            return;
          }
          return chatHandler(req, res);
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      geminiDevApiPlugin(env),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  };
});
