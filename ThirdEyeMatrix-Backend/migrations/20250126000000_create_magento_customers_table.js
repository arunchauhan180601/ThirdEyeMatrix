/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('magento_customers', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('magento_customer_id').notNullable().comment('Unique identifier from Magento');
    table.string('first_name').nullable();
    table.string('last_name').nullable();
    table.string('email').nullable();
    table.integer('website_id').nullable().defaultTo(1).comment('Website ID from Magento');
    table.integer('group_id').nullable().defaultTo(1).comment('Customer group ID from Magento');
    table.boolean('is_subscribed').nullable().defaultTo(true).comment('Email subscription status');
    table.integer('gender').nullable().comment('Gender: 1=Male, 2=Female, 3=Not specified');
    table.string('default_billing').nullable().comment('Default billing address ID');
    table.string('default_shipping').nullable().comment('Default shipping address ID');
    table.timestamp('magento_created_at').nullable().comment('Customer creation date from Magento');
    table.jsonb('addresses').nullable().comment('Array of address objects with id, city, country_id, postcode, street, telephone, region');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate customers per store
    table.unique(['store_id', 'magento_customer_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('magento_customers');
};

