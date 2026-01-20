require('dotenv').config();
const app = require('./app');
const { initSocket } = require('./services/socketService');
const { testConnection } = require('./db/pool');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    // Solo probar conexión a MySQL (sin crear tablas)
    await testConnection();
    logger.info('✅ Conexión a MySQL establecida correctamente');
    logger.info('✅ Base de datos y tablas ya existen - omitiendo creación');

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
      logger.info(`📱 Frontend Cajero: http://localhost:3000`);
      logger.info(`🍳 Frontend Cocina: http://localhost:3002`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 Socket.IO: http://localhost:${PORT} (WebSockets)`);
    });

    // Inicializar Socket.IO
    initSocket(server);
  } catch (error) {
    logger.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  }
};

// Manejo graceful de shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();