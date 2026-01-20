const Joi = require('joi');

// Esquema para validar items de la orden
const itemSchema = Joi.object({
  nombre_item: Joi.string().max(150).required().messages({
    'string.empty': 'El nombre del item es requerido',
    'string.max': 'El nombre del item no puede exceder los 150 caracteres'
  }),
  cantidad: Joi.number().integer().min(1).max(100).required().messages({
    'number.min': 'La cantidad debe ser al menos 1',
    'number.max': 'La cantidad no puede exceder 100',
    'number.base': 'La cantidad debe ser un número'
  }),
  precio: Joi.number().precision(2).min(0).required().messages({
    'number.min': 'El precio no puede ser negativo',
    'number.precision': 'El precio debe tener máximo 2 decimales',
    'number.base': 'El precio debe ser un número'
  }),
  observacion: Joi.string().max(255).allow('').optional()
});

// Esquema para validar la orden completa
const ordenSchema = Joi.object({
  temp_id: Joi.string().max(50).optional().messages({
    'string.max': 'El temp_id no puede exceder los 50 caracteres'
  }),
  cliente: Joi.string().max(100).required().messages({
    'string.empty': 'El cliente es requerido',
    'string.max': 'El nombre del cliente no puede exceder los 100 caracteres'
  }),
  total: Joi.number().precision(2).min(0).required().messages({
    'number.min': 'El total no puede ser negativo',
    'number.precision': 'El total debe tener máximo 2 decimales',
    'number.base': 'El total debe ser un número'
  }),
  notas: Joi.string().allow('').optional(),
  items: Joi.array().items(itemSchema).min(1).max(50).required().messages({
    'array.min': 'La orden debe tener al menos un item',
    'array.max': 'La orden no puede tener más de 50 items'
  })
});

// Esquema para validar actualización de orden
const actualizacionOrdenSchema = Joi.object({
  estado: Joi.string().valid('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado').optional(),
  cliente: Joi.string().max(100).optional(),
  notas: Joi.string().allow('').optional(),
  total: Joi.number().precision(2).min(0).optional()
}).min(1).messages({
  'object.min': 'Debe proporcionar al menos un campo para actualizar'
});

const validarOrden = (data) => {
  return ordenSchema.validate(data, { 
    abortEarly: false,
    stripUnknown: true
  });
};

const validarActualizacionOrden = (data) => {
  return actualizacionOrdenSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  validarOrden,
  validarActualizacionOrden,
  itemSchema,
  ordenSchema
};