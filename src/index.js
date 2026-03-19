require('dotenv').config();
const app = require('./app');
const { initSocket } = require('./services/socketService');
const { testConnection } = require('./db/pool');
const Knex = require('knex');
const mysql2 = require('mysql2');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    logger.info('🔍 Verificando conexión a base de datos...');
    
    // Intentar conexión normal
    try {
      await testConnection();
      logger.info('✅ Conexión a MySQL OK - usando DB existente');
    } catch (dbError) {
      if (dbError.code === 'ER_BAD_DB_ERROR') {
        logger.info('📦 DB no existe - Creando automáticamente...');
        
        // Conexión admin sin DB
        const adminConfig = {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || ''
        };
        
        const adminConn = mysql2.createConnection(adminConfig);
        const dbName = process.env.DB_NAME || 'carrito_comidas';
        
        await new Promise((resolve, reject) => {
          adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`` , (err) => {
            adminConn.end();
            if (err) reject(err);
            else {
              logger.info(`✅ DB '${dbName}' creada`);
              resolve();
            }
          });
        });
        
        // Migraciones
        logger.info('🔄 Ejecutando migraciones...');
        const knexConfig = require('../knexfile')[process.env.NODE_ENV || 'development'];
        const knexInstance = Knex(knexConfig);
        await knexInstance.migrate.latest();
        knexInstance.destroy();
        logger.info('✅ Migraciones OK - Tablas listas');
        
      } else {
        throw dbError;
      }
    }
  } catch (error) {
    logger.error('💥 Error DB:', error.message);
    process.exit(1);
  }
  
  // Conexión final OK
  await testConnection();
  logger.info('✅ DB lista');
  
  // Server
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server puerto ${PORT}`);
    logger.info('📱 Cajero localhost:3000');
    logger.info('🍳 Cocina localhost:3002');
    logger.info(`🏥 http://localhost:${PORT}/health`);
  });
  initSocket(server);
};

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

startServer();
