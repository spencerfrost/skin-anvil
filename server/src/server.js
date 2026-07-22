import cors from 'cors';
import express from 'express';

import config from './config/config.js';
import routes from './routes/routes.js';

const app = express();

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Use the routes
app.use(routes);

// Start server
app.listen(config.PORT, () => {
  console.log(
    `Server is running in ${
      config.isDev ? 'development' : 'production'
    } mode on ${config.DOMAIN}`
  );
});
