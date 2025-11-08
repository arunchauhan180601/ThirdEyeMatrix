/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', function(table) {
    table.increments('id').primary();
    table.integer('role_id').unsigned().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').unsigned().references('id').inTable('permissions').onDelete('CASCADE');
    table.unique(['role_id', 'permission_id']);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('role_permissions');
};
