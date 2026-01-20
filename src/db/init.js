const mysql = require('mysql2');
const logger = require('../utils/logger');

const initDatabase = async () => {
  // Conectamos directamente a la base de datos ya creada
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'carrito_comidas'
  });

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        logger.error('Error conectando a MySQL:', err.message);
        reject(err);
        return;
      }

      logger.info('✅ Conexión a base de datos establecida');

      // Crear tabla ordenes
      const createOrdenesTable = `
        CREATE TABLE IF NOT EXISTS ordenes (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          temp_id VARCHAR(50) UNIQUE,
          cliente VARCHAR(100) NOT NULL DEFAULT 'Mostrador 1',
          total DECIMAL(10,2) NOT NULL,
          estado ENUM('pendiente','en_preparacion','listo','entregado','cancelado') DEFAULT 'pendiente',
          notas TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_estado_created (estado, created_at),
          INDEX idx_temp_id (temp_id)
        )
      `;

      // Crear tabla orden_items
      const createOrdenItemsTable = `
        CREATE TABLE IF NOT EXISTS orden_items (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          orden_id BIGINT NOT NULL,
          nombre_item VARCHAR(150) NOT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          precio DECIMAL(10,2) NOT NULL,
          observacion VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
          INDEX idx_orden_id (orden_id)
        )
      `;

      connection.query(createOrdenesTable, (err) => {
        if (err) {
          logger.error('Error creando tabla ordenes:', err);
          reject(err);
          return;
        }

        logger.info('✅ Tabla ordenes verificada/creada');

        connection.query(createOrdenItemsTable, (err) => {
          if (err) {
            logger.error('Error creando tabla orden_items:', err);
            reject(err);
            return;
          }

          logger.info('✅ Tabla orden_items verificada/creada');
          connection.end();
          resolve();
        });
      });
    });
  });
};

module.exports = { initDatabase };
