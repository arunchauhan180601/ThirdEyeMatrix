/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.text("klaviyo_access_token");
    table.text("klaviyo_refresh_token");
    table.timestamp("klaviyo_token_expires_at");
    table.timestamp("klaviyo_connected_at");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.dropColumn("klaviyo_access_token");
    table.dropColumn("klaviyo_refresh_token");
    table.dropColumn("klaviyo_token_expires_at");
    table.dropColumn("klaviyo_connected_at");
  });
};
