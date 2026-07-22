const isDev = process.env.NODE_ENV !== 'production';

const PROD_DOMAIN = 'https://skinanvil.mrspinn.ca';
const DEFAULT_PORT = isDev ? 3004 : 3220;
const PORT = process.env.PORT || DEFAULT_PORT;

const corsOptions = {
  origin: isDev ? /^http:\/\/localhost:\d+$/ : PROD_DOMAIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default {
  PORT,
  isDev,
  DOMAIN: isDev ? `http://localhost:${PORT}` : PROD_DOMAIN,
  corsOptions,
};
