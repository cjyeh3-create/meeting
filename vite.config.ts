import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables for the development server
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      // Custom Dev Server Middleware to intercept /api/generate in local development
      {
        name: 'api-generate-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/generate') && req.method === 'POST') {
              try {
                // Dynamically compile and load the handler using Vite's SSR module loader
                const { default: handler } = await server.ssrLoadModule('/api/generate.ts');
                
                // Buffer the incoming JSON payload stream
                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                
                req.on('end', async () => {
                  try {
                    const parsedBody = body ? JSON.parse(body) : {};
                    
                    // Construct mock Request and Response objects to match Vercel API signature
                    const mockReq = {
                      method: req.method,
                      body: parsedBody,
                      headers: req.headers
                    };
                    
                    const mockRes = {
                      status(statusCode: number) {
                        res.statusCode = statusCode;
                        return this;
                      },
                      json(data: any) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                        return this;
                      },
                      setHeader(name: string, value: string) {
                        res.setHeader(name, value);
                        return this;
                      },
                      end(data?: any) {
                        res.end(data);
                        return this;
                      }
                    };
                    
                    await handler(mockReq, mockRes);
                  } catch (err: any) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: err.message || 'Internal Dev Server Error' }));
                  }
                });
              } catch (err: any) {
                console.error('Error loading API handler in dev server:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Failed to load API handler' }));
              }
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
