const logger = require('../utils/logger');

// Servicio para manejar lógica de sincronización y reconciliación
const syncService = {
  /**
   * Genera un hash para detectar duplicados basado en el contenido de la orden
   */
  generateOrderHash(orderData) {
    const { cliente, items, total } = orderData;
    
    // Crear una representación consistente de los items
    const itemsString = items
      .map(item => `${item.nombre_item}-${item.cantidad}-${item.precio}-${item.observacion || ''}`)
      .sort()
      .join('|');
    
    return Buffer.from(`${cliente}|${itemsString}|${total}`).toString('base64');
  },

  /**
   * Valida si una orden local puede ser reconciliada con una orden del servidor
   */
  validateReconciliation(localOrder, serverOrder) {
    const discrepancies = [];

    // Verificar total
    if (parseFloat(localOrder.total) !== parseFloat(serverOrder.total)) {
      discrepancies.push(`Total diferente: local=${localOrder.total}, servidor=${serverOrder.total}`);
    }

    // Verificar cantidad de items
    if (localOrder.items.length !== serverOrder.items.length) {
      discrepancies.push(`Cantidad de items diferente: local=${localOrder.items.length}, servidor=${serverOrder.items.length}`);
    }

    // Verificar items individuales
    localOrder.items.forEach((localItem, index) => {
      const serverItem = serverOrder.items[index];
      if (serverItem) {
        if (localItem.nombre_item !== serverItem.nombre_item) {
          discrepancies.push(`Item ${index} nombre diferente`);
        }
        if (localItem.cantidad !== serverItem.cantidad) {
          discrepancies.push(`Item ${index} cantidad diferente`);
        }
        if (parseFloat(localItem.precio) !== parseFloat(serverItem.precio)) {
          discrepancies.push(`Item ${index} precio diferente`);
        }
      }
    });

    return {
      isValid: discrepancies.length === 0,
      discrepancies
    };
  },

  /**
   * Procesa múltiples órdenes pendientes de sincronización
   */
  async processPendingSync(orders, syncFunction) {
    const results = {
      successful: [],
      failed: [],
      duplicates: []
    };

    for (const order of orders) {
      try {
        const result = await syncFunction(order);
        
        if (result.duplicate) {
          results.duplicates.push({
            temp_id: order.temp_id,
            server_id: result.serverId
          });
        } else {
          results.successful.push({
            temp_id: order.temp_id,
            server_id: result.serverId
          });
        }
      } catch (error) {
        results.failed.push({
          temp_id: order.temp_id,
          error: error.message
        });
      }
    }

    return results;
  }
};

module.exports = syncService;