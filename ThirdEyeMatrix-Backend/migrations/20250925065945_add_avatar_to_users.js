/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
   return knex.schema.table('users', function(table) {
    table.string('avatar'); // Adds a string column for the avatar URL/path
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.table('users', function(table) {
    table.dropColumn('avatar'); // Drops the avatar column if rolling back
  });
};
