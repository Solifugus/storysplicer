/**
 * Database configuration
 * Reads from environment variables with sensible defaults
 */

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'storysplicer',
  user: process.env.DB_USER || 'storysplicer',
  password: process.env.DB_PASSWORD || 'storysplicer',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '2000', 10),
};
