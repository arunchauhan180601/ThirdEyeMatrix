/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('shopify_products', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('product_id').notNullable().comment('Unique identifier from Shopify');
    table.string('name').notNullable();
    table.text('tags').nullable().comment('Comma-separated tags');
    table.string('product_type').nullable();
    table.string('vendor').nullable();
    table.jsonb('variants').nullable().comment('Array of variant objects with variant_id, sku, taxable, price, requires_shipping, inventory_quantity');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate products per store
    table.unique(['store_id', 'product_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('shopify_products');
};

