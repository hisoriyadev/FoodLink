export const getAllowedOrigins = () => {
  const configured = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, '')).filter(Boolean)
    : [];

  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
  return Array.from(new Set([...configured, ...defaults]));
};

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();
    const cleanOrigin = origin.replace(/\/+$/, '');

    if (allowed.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // In development mode, allow any localhost/127.0.0.1 port
    if (process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
};

export default corsOptions;
