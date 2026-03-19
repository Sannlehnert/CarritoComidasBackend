const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

// Configuración del pool de conexiones
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carrito_comidas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(poolConfig);

// Función para probar la conexión (SOLO conexión, sin crear nada)
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Solo hacer una consulta simple para verificar que funciona
    await connection.execute('SELECT 1');
    
    logger.info('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    logger.error('❌ Error conectando a MySQL:', error.message);
    
    // Dar instrucciones específicas según el error
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      logger.info('💡 Solución: Verifica el usuario y contraseña en el archivo .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      logger.info(`💡 La base de datos '${poolConfig.database}' no existe - será creada automáticamente al iniciar.`);

    } else if (error.code === 'ECONNREFUSED') {
      logger.info('💡 Solución: Asegúrate que MySQL esté instalado y corriendo');
    }
    
    throw error;
  }
};

// Manejo de eventos del pool
pool.on('acquire', (connection) => {
  logger.debug('Conexión adquirida:', connection.threadId);
});

pool.on('release', (connection) => {
  logger.debug('Conexión liberada:', connection.threadId);
});

pool.on('enqueue', () => {
  logger.debug('Esperando por conexión disponible...');
});

module.exports = {
  pool,
  testConnection,
  execute: (...args) => pool.execute(...args),
  query: (...args) => pool.query(...args),
  getConnection: () => pool.getConnection()
};