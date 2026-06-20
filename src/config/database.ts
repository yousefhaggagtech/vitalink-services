import sql from 'mssql';
import { env } from './env';
import { logger } from '../utils/logger';

class DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;
  private connectionPromise: Promise<sql.ConnectionPool> | null = null;

  async connect(): Promise<sql.ConnectionPool> {
    if (this.pool?.connected) {
      return this.pool;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.createPool();

    try {
      return await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async createPool(): Promise<sql.ConnectionPool> {
    const config: sql.config = {
      server: env.db.server,
      port: 9659,
      database: env.db.database,
      user: env.db.user,
      password: env.db.password,
      options: {
        encrypt: env.db.encrypt,
        trustServerCertificate: !env.isProduction,
        enableArithAbort: true,
      },
      pool: {
        max: 1,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      requestTimeout: 30000,
      connectionTimeout: 15000,
    };

    const pool = new sql.ConnectionPool(config);

    pool.on('error', (err) => {
      logger.error('SQL Pool error:', err);
      if (this.pool === pool) {
        this.pool = null;
      }
    });

    try {
      const connectedPool = await pool.connect();
      this.pool = connectedPool;
      logger.info('Database connected successfully');
      return connectedPool;
    } catch (error) {
      await pool.close().catch((closeError) => {
        logger.warn('Failed to close SQL pool after connection error:', closeError);
      });
      this.pool = null;
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async getPool(): Promise<sql.ConnectionPool> {
    if (!this.pool?.connected) {
      logger.warn('Database pool not ready; connecting now...');
    }

    return this.connect();
  }

  async close(): Promise<void> {
    if (this.pool) {
      const pool = this.pool;
      this.pool = null;
      await pool.close();
    }
  }
}

export const db = new DatabaseConnection();
