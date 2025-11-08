/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable("stores", function(table) {
    table.renameColumn("woocommerce_access_token", "woocommerce_consumer_key");
    table.renameColumn("woocommerce_access_token_secret", "woocommerce_consumer_secret");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.alterTable("stores", function(table) {
    table.renameColumn("woocommerce_consumer_key", "woocommerce_access_token");
    table.renameColumn("woocommerce_consumer_secret", "woocommerce_access_token_secret");
  });
};
