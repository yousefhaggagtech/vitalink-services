import sql from 'mssql';
import { env } from './env';
import { logger } from '../utils/logger';

class DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  async connect(): Promise<sql.ConnectionPool> {
    try {
      const config: sql.config = {
        server: env.db.server,
        port: env.db.port,
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

      if (this.pool) {
        return this.pool;
      }

      this.pool = await new sql.ConnectionPool(config).connect();
      
      this.pool.on('error', (err) => {
        logger.error('SQL Pool error:', err);
      });

      this.reconnectAttempts = 0;
      logger.info('✅ Database connected successfully');
      return this.pool;
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      await this.handleReconnect();
      throw error;
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      logger.warn(`Reconnecting... attempt ${this.reconnectAttempts} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.connect();
      return;
    }
    logger.error('❌ Max reconnect attempts reached. Server keeping alive for troubleshooting.');
  }

  getPool(): sql.ConnectionPool {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    return this.pool;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}

export const db = new DatabaseConnection();
