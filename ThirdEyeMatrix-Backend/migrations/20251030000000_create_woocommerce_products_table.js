/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('woocommerce_products', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('product_id').notNullable().comment('Unique identifier from WooCommerce');
    table.string('name').notNullable();
    table.string('sku').nullable();
    table.integer('price').nullable();
    table.string('tax_status').nullable();
    table.string('variant_id').nullable().comment('For variant products if applicable');
    table.string('currency', 10).nullable().comment('Currency code (USD, INR, etc)');
    table.string('stock_status').nullable().comment('in stock / out of stock / backorder');
    table.jsonb('categories').nullable().comment('Array includes id, name, slug');
    table.string('brand').nullable();
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate products per store
    table.unique(['store_id', 'product_id', 'variant_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('woocommerce_products');
};

