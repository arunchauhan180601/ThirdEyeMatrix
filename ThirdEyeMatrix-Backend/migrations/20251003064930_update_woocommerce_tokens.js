/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.renameColumn("access_token_secret", "woocommerce_access_token_secret"); // rename old column
    table.text("woocommerce_access_token"); // add new column
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable("stores", function(table) {
    table.renameColumn("woocommerce_access_token_secret", "access_token_secret"); // rollback rename
    table.dropColumn("woocommerce_access_token"); // remove new column
  });
};
