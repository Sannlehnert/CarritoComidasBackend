const express = require('express');
const { 
  crearOrden, 
  obtenerOrdenes, 
  obtenerOrdenPorId, 
  actualizarOrden,
  eliminarOrden
} = require('../controllers/ordenController');

const router = express.Router();

// POST /ordenes - Crear nueva orden
router.post('/', crearOrden);

// GET /ordenes - Obtener todas las órdenes (con filtro opcional)
router.get('/', obtenerOrdenes);

// GET /ordenes/:id - Obtener orden específica
router.get('/:id', obtenerOrdenPorId);

// PATCH /ordenes/:id - Actualizar orden (principalmente estado)
router.patch('/:id', actualizarOrden);

// DELETE /ordenes/:id - Eliminar orden (solo desarrollo)
router.delete('/:id', eliminarOrden);

module.exports = router;