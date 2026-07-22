import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetchSkin from '../controllers/fetchSkin.js';

import config from '../config/config.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
router.get('/api/fetch-skin/:name', fetchSkin);

// Serve React app in production
if (!config.isDev) {
  const clientBuildPath = path.join(__dirname, '../client/build');
  router.use(express.static(clientBuildPath));
  router.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

export default router;
