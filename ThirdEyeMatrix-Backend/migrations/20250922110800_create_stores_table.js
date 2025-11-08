/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('stores', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('store_name'); // Added store_name, assuming it's needed
    table.string('store_URL').notNullable();
    table.string('store_annual_revenue');
    table.string('store_currency');
    table.string('store_timezone');
    table.string('store_industry_category');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('stores');
};
