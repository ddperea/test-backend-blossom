import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.POSTGRES_DATABASE || 'postgres',
  process.env.POSTGRES_USER || '',
  process.env.POSTGRES_PASSWORD || '',
  {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' || process.env.POSTGRES_SSL === 'true'
        ? { require: true, rejectUnauthorized: false }
        : false
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * Verifica la conexión a PostgreSQL
 * @throws Error si la conexión falla (fail-fast)
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL: Connection established successfully');
  } catch (error) {
    console.error('❌ PostgreSQL: Unable to connect to database');
    console.error((error as Error).message);
    throw error; // Fail-fast: propagar error para detener el servidor
  }
};

export default sequelize;
