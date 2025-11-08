/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('woocommerce_customers', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.bigInteger('woo_customer_id').unique().notNullable().comment('Unique identifier from WooCommerce');
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    table.string('email', 255).nullable();
    table.timestamp('date_created').defaultTo(knex.fn.now());
    table.boolean('is_paying_customer').defaultTo(false);
    
    // Billing details as JSONB array (array of objects)
    table.jsonb('billing').nullable().comment('Array of billing address objects');
    
    // Shipping details as JSONB array (array of objects)
    table.jsonb('shipping').nullable().comment('Array of shipping address objects');
    
    table.timestamps(true, true);
    
    // Composite unique constraint to prevent duplicate customers per store
    table.unique(['store_id', 'woo_customer_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('woocommerce_customers');
};

