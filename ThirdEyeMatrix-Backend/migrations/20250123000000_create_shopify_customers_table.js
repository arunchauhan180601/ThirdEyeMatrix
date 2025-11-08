/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('shopify_customers', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('shopify_customer_id').notNullable().comment('Unique identifier from Shopify');
    table.string('first_name').nullable();
    table.string('last_name').nullable();
    table.string('email').nullable();
    table.jsonb('addresses').nullable().comment('Array of address objects with address1, address2, city, company, country_name, phone, zip');
    table.text('tags').nullable().comment('Comma-separated tags');
    table.string('currency').nullable();
    table.decimal('total_spent', 10, 2).nullable().defaultTo(0);
    table.timestamp('shopify_created_at').nullable().comment('Customer creation date from Shopify');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate customers per store
    table.unique(['store_id', 'shopify_customer_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('shopify_customers');
};

