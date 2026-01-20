exports.up = function(knex) {
  return knex.schema
    .createTable('ordenes', function(table) {
      table.bigIncrements('id').primary();
      table.string('temp_id', 50).unique().comment('ID temporal para idempotencia offline');
      table.string('cliente', 100).notNullable().defaultTo('Mostrador 1');
      table.decimal('total', 10, 2).notNullable();
      table.enu('estado', ['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado'])
           .defaultTo('pendiente');
      table.text('notas').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index(['estado', 'created_at']);
      table.index(['temp_id']);
    })
    .then(() => {
      console.log('Tabla ordenes creada exitosamente');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('ordenes')
    .then(() => {
      console.log('Tabla ordenes eliminada');
    });
};