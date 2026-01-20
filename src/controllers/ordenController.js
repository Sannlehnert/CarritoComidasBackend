const ordenService = require('../services/ordenService');
const { validarOrden, validarActualizacionOrden } = require('../utils/validators');
const logger = require('../utils/logger');

const crearOrden = async (req, res, next) => {
  try {
    // Validar los datos de entrada
    const { error, value } = validarOrden(req.body);
    if (error) {
      logger.warn('Validación fallida al crear orden:', error.details);
      return res.status(400).json({ 
        error: 'Datos de orden inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    logger.info('Creando nueva orden para cliente:', value.cliente);
    const orden = await ordenService.crearOrden(value);
    
    logger.info(`Orden creada exitosamente - ID: ${orden.id}, Temp ID: ${orden.temp_id}`);
    res.status(201).json(orden);
  } catch (error) {
    logger.error('Error en crearOrden:', error);
    next(error);
  }
};

const obtenerOrdenes = async (req, res, next) => {
  try {
    const { estado, limit = 50, offset = 0 } = req.query;
    
    logger.info(`Obteniendo órdenes - estado: ${estado || 'todos'}`);
    const ordenes = await ordenService.obtenerOrdenes({ estado, limit, offset });
    
    res.json({
      ordenes,
      paginacion: {
        total: ordenes.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error('Error en obtenerOrdenes:', error);
    next(error);
  }
};

const obtenerOrdenPorId = async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Buscando orden con ID: ${id}`);
    
    const orden = await ordenService.obtenerOrdenPorId(parseInt(id));
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    res.json(orden);
  } catch (error) {
    logger.error('Error en obtenerOrdenPorId:', error);
    next(error);
  }
};

const actualizarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validar actualización
    const { error, value } = validarActualizacionOrden(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Datos de actualización inválidos',
        details: error.details.map(detail => detail.message)
      });
    }

    logger.info(`Actualizando orden ID: ${id}`, value);
    const orden = await ordenService.actualizarOrden(parseInt(id), value);
    
    if (!orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    
    logger.info(`Orden ${id} actualizada exitosamente - Nuevo estado: ${orden.estado}`);
    res.json(orden);
  } catch (error) {
    logger.error('Error en actualizarOrden:', error);
    next(error);
  }
};

const eliminarOrden = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // En producción, considerar hacer soft delete en lugar de eliminar físicamente
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Eliminación no permitida en producción' });
    }
    
    logger.warn(`Eliminando orden ID: ${id}`);
    await ordenService.eliminarOrden(parseInt(id));
    
    res.json({ message: 'Orden eliminada exitosamente' });
  } catch (error) {
    logger.error('Error en eliminarOrden:', error);
    next(error);
  }
};

module.exports = {
  crearOrden,
  obtenerOrdenes,
  obtenerOrdenPorId,
  actualizarOrden,
  eliminarOrden
};