/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('magento_products', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('magento_product_id').notNullable().comment('Unique identifier from Magento');
    table.string('name').nullable();
    table.decimal('price', 10, 2).nullable();
    table.string('sku').nullable();
    table.timestamp('magento_created_at').nullable().comment('Product creation date from Magento');
    table.string('type_id').nullable().defaultTo('simple');
    table.jsonb('tier_prices').nullable().comment('Array of tier price objects with customer_group_id, qty, value');
    table.integer('status').nullable().defaultTo(1).comment('Product status (1=enabled, 2=disabled)');
    table.integer('visibility').nullable().defaultTo(4).comment('Product visibility (1=Not Visible, 2=Catalog, 3=Search, 4=Catalog and Search)');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate products per store
    table.unique(['store_id', 'magento_product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('magento_products');
};

