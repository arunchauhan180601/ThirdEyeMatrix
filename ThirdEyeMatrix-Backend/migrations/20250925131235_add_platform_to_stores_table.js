/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
      return knex.schema.table('stores', function(table) {
      table.string('platform').notNullable(); 
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('stores', function(table) {
    table.dropColumn('platform'); 
  });
};
