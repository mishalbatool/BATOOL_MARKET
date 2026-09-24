import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Increase payload limit for media uploads (up to 100MB for video)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Ensure upload directories exist
  const uploadsDir = path.resolve(__dirname, 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(uploadsDir, {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));

  // Upload API endpoint
  app.post('/api/upload', (req, res) => {
    try {
      const { filename, base64Data, folder } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'Filename and base64Data are required' });
      }

      const safeFolder = (folder === 'videos' ? 'videos' : 'images');
      const targetFolder = path.join(uploadsDir, safeFolder);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const cleanFileName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const filePath = path.join(targetFolder, cleanFileName);

      // Remove base64 header if present (e.g. data:image/jpeg;base64,)
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');

      fs.writeFileSync(filePath, buffer);

      const fileUrl = `/uploads/${safeFolder}/${cleanFileName}`;
      return res.json({ success: true, url: fileUrl });
    } catch (err: any) {
      console.error('Server upload error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to save file' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Batool Market server running on port ${PORT}`);
  });
}

startServer();
