exports.up = function(knex) {
  return knex.schema
    .createTable('orden_items', function(table) {
      table.bigIncrements('id').primary();
      table.bigInteger('orden_id').unsigned().notNullable();
      table.string('nombre_item', 150).notNullable();
      table.integer('cantidad').unsigned().defaultTo(1);
      table.decimal('precio', 10, 2).notNullable();
      table.string('observacion', 255).nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Foreign key
      table.foreign('orden_id').references('id').inTable('ordenes').onDelete('CASCADE');
      
      // Índices
      table.index(['orden_id']);
    })
    .then(() => {
      console.log('Tabla orden_items creada exitosamente');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('orden_items')
    .then(() => {
      console.log('Tabla orden_items eliminada');
    });
};