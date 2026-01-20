const { v4: uuidv4 } = require('uuid');
const db = require('../db/pool');
const { emitNuevaOrden, emitOrdenActualizada } = require('./socketService');
const logger = require('../utils/logger');

class OrdenService {
  async crearOrden(datosOrden) {
    const { temp_id, cliente, total, notas, items } = datosOrden;

    // Verificar si ya existe una orden con el mismo temp_id (idempotencia)
    if (temp_id) {
      const ordenExistente = await this.obtenerOrdenPorTempId(temp_id);
      if (ordenExistente) {
        logger.info(`Orden duplicada detectada por temp_id: ${temp_id}, retornando orden existente`);
        return ordenExistente;
      }
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Insertar la orden
      const [result] = await connection.execute(
        `INSERT INTO ordenes (temp_id, cliente, total, notas, estado) 
         VALUES (?, ?, ?, ?, 'pendiente')`,
        [temp_id || uuidv4(), cliente, total, notas || '']
      );

      const ordenId = result.insertId;

      // Insertar items de la orden
      for (const item of items) {
        await connection.execute(
          `INSERT INTO orden_items (orden_id, nombre_item, cantidad, precio, observacion) 
           VALUES (?, ?, ?, ?, ?)`,
          [ordenId, item.nombre_item, item.cantidad, item.precio, item.observacion || '']
        );
      }

      await connection.commit();

      // Obtener la orden completa recién creada
      const ordenCompleta = await this.obtenerOrdenPorId(ordenId);

      // Emitir evento de nueva orden
      emitNuevaOrden(ordenCompleta);

      return ordenCompleta;
    } catch (error) {
      await connection.rollback();
      logger.error('Error en transacción de crearOrden:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async obtenerOrdenPorTempId(temp_id) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM ordenes WHERE temp_id = ?`,
        [temp_id]
      );

      if (rows.length === 0) {
        return null;
      }

      const orden = rows[0];
      orden.items = await this.obtenerItemsPorOrdenId(orden.id);

      return orden;
    } catch (error) {
      logger.error('Error en obtenerOrdenPorTempId:', error);
      throw error;
    }
  }

  async obtenerOrdenPorId(id) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM ordenes WHERE id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const orden = rows[0];
      orden.items = await this.obtenerItemsPorOrdenId(orden.id);

      return orden;
    } catch (error) {
      logger.error('Error en obtenerOrdenPorId:', error);
      throw error;
    }
  }

  async obtenerItemsPorOrdenId(ordenId) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM orden_items WHERE orden_id = ?`,
        [ordenId]
      );

      return rows;
    } catch (error) {
      logger.error('Error en obtenerItemsPorOrdenId:', error);
      throw error;
    }
  }

  async obtenerOrdenes({ estado, limit, offset }) {
    try {
      let query = `
        SELECT o.*, 
               COUNT(oi.id) as total_items,
               SUM(oi.cantidad) as total_cantidad
        FROM ordenes o
        LEFT JOIN orden_items oi ON o.id = oi.orden_id
      `;
      const params = [];

      if (estado) {
        query += ` WHERE o.estado = ?`;
        params.push(estado);
      }

      query += ` 
        GROUP BY o.id
        ORDER BY o.created_at DESC 
        LIMIT ? OFFSET ?
      `;
      params.push(parseInt(limit), parseInt(offset));

      const [ordenes] = await db.execute(query, params);

      // Para cada orden, obtener sus items completos
      for (const orden of ordenes) {
        orden.items = await this.obtenerItemsPorOrdenId(orden.id);
      }

      return ordenes;
    } catch (error) {
      logger.error('Error en obtenerOrdenes:', error);
      throw error;
    }
  }

  async actualizarOrden(id, datosActualizacion) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const campos = [];
      const valores = [];

      // Construir dinámicamente la consulta UPDATE
      Object.keys(datosActualizacion).forEach(key => {
        campos.push(`${key} = ?`);
        valores.push(datosActualizacion[key]);
      });

      if (campos.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      valores.push(id);

      const query = `UPDATE ordenes SET ${campos.join(', ')} WHERE id = ?`;
      
      const [result] = await connection.execute(query, valores);

      if (result.affectedRows === 0) {
        throw new Error('Orden no encontrada');
      }

      await connection.commit();

      // Obtener la orden actualizada
      const ordenActualizada = await this.obtenerOrdenPorId(id);

      // Emitir evento de orden actualizada
      emitOrdenActualizada(ordenActualizada);

      return ordenActualizada;
    } catch (error) {
      await connection.rollback();
      logger.error('Error en actualizarOrden:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async eliminarOrden(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Primero eliminar los items (por la foreign key)
      await connection.execute(
        `DELETE FROM orden_items WHERE orden_id = ?`,
        [id]
      );

      // Luego eliminar la orden
      const [result] = await connection.execute(
        `DELETE FROM ordenes WHERE id = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Orden no encontrada');
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error('Error en eliminarOrden:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new OrdenService();