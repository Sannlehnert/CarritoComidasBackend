const { Server } = require('socket.io');
const logger = require('../utils/logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGINS ? 
        process.env.SOCKET_CORS_ORIGINS.split(',') : [
          'http://localhost:3000',
          'http://localhost:3002',
          'http://localhost:5173',
          'http://localhost:5174'
        ],
      methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Cliente conectado: ${socket.id}`);

    // Unirse a la sala de cocina si es necesario
    socket.on('join-kitchen', () => {
      socket.join('kitchen');
      logger.info(`👨‍🍳 Cliente ${socket.id} se unió a la cocina`);
    });

    // Unirse a la sala de cajero si es necesario
    socket.on('join-cashier', () => {
      socket.join('cashier');
      logger.info(`💼 Cliente ${socket.id} se unió al cajero`);
    });

    // Confirmación de recepción de eventos
    socket.on('ack-orden', (data) => {
      logger.info(`✅ ACK recibido de ${socket.id} para orden:`, data);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Cliente desconectado: ${socket.id} - Razón: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`❌ Error en socket ${socket.id}:`, error);
    });
  });

  return io;
};

const emitNuevaOrden = (orden) => {
  if (io) {
    logger.info(`📢 Emitiendo nueva-orden: ${orden.id}`);
    io.emit('nueva-orden', orden);
    // También emitir específicamente a la cocina
    io.to('kitchen').emit('nueva-orden', orden);
  } else {
    logger.warn('Socket.IO no inicializado, no se puede emitir nueva-orden');
  }
};

const emitOrdenActualizada = (orden) => {
  if (io) {
    logger.info(`📢 Emitiendo orden-actualizada: ${orden.id} - Estado: ${orden.estado}`);
    io.emit('orden-actualizada', {
      id: orden.id,
      estado: orden.estado,
      updated_at: orden.updated_at
    });
  } else {
    logger.warn('Socket.IO no inicializado, no se puede emitir orden-actualizada');
  }
};

// Función para obtener estadísticas de conexiones
const getConnectionStats = () => {
  if (io) {
    return {
      totalConnections: io.engine.clientsCount,
      kitchenConnections: io.sockets.adapter.rooms.get('kitchen')?.size || 0,
      cashierConnections: io.sockets.adapter.rooms.get('cashier')?.size || 0
    };
  }
  return null;
};

module.exports = {
  initSocket,
  emitNuevaOrden,
  emitOrdenActualizada,
  getConnectionStats
};