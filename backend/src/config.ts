import dotenv from 'dotenv';
dotenv.config();

/** CORS Origin must match the browser exactly — no trailing slash (browsers send Origin without it). */
function normalizeFrontendUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/veda-ai',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  frontendUrl: normalizeFrontendUrl(process.env.FRONTEND_URL || 'http://localhost:3000'),
};
