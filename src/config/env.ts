import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config();

const envSchema = joi.object({
  NODE_ENV: joi.string().valid('development', 'production', 'test').required(),
  PORT: joi.number().default(4000),
  SERVICE_NAME: joi.string().default('vitalink-services'),
  
  DB_SERVER: joi.string().required(),
  DB_PORT: joi.number().default(1433),
  DB_NAME: joi.string().required(),
  DB_USER: joi.string().required(),
  DB_PASSWORD: joi.string().required(),
  DB_ENCRYPT: joi.boolean().default(true),
  
  JWT_SECRET: joi.string().required().min(32),
  JWT_AUDIENCE: joi.string().default('VitaLinkClient'),
  JWT_ISSUER: joi.string().default('VitaLinkAPI'),
  
  ALLOWED_ORIGINS: joi.string().required(),
  
  AI_CACHE_TTL_SECONDS: joi.number().default(3),
  AI_STALE_THRESHOLD_SECONDS: joi.number().default(30),
  AI_WARMUP_DURATION_SECONDS: joi.number().default(120),
}).unknown();

const { error, value } = envSchema.validate(process.env);
if (error) {
  console.error('❌ Invalid environment variables:', error.details);
  process.exit(1);
}

export const env = {
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  serviceName: value.SERVICE_NAME,
  isProduction: value.NODE_ENV === 'production',
  
  db: {
    server: value.DB_SERVER,
    port: value.DB_PORT,
    database: value.DB_NAME,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    encrypt: value.DB_ENCRYPT,
  },
  
  jwt: {
    secret: value.JWT_SECRET,
    audience: value.JWT_AUDIENCE,
    issuer: value.JWT_ISSUER,
  },
  
  allowedOrigins: value.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim()),
  
  ai: {
    cacheTtlSeconds: value.AI_CACHE_TTL_SECONDS,
    staleThresholdSeconds: value.AI_STALE_THRESHOLD_SECONDS,
    warmupDurationSeconds: value.AI_WARMUP_DURATION_SECONDS,
  },
};
