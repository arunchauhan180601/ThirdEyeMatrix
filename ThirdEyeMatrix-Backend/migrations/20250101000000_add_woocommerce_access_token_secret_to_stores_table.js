/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
   return knex.schema.alterTable("stores", function(table) {
    table.text("access_token_secret"); 
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
   return knex.schema.alterTable("stores", function(table) {
    table.dropColumn("access_token_secret"); 
  });
};
