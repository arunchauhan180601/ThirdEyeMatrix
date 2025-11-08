/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.text("google_access_token");
    table.text("google_refresh_token");
    table.timestamp("google_token_expires_at");
    table.string("google_customer_id");
    table.string("google_customer_name");
    table.string("google_manager_account_id");
    table.string("google_manager_account_name");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.dropColumn("google_access_token");
    table.dropColumn("google_refresh_token");
    table.dropColumn("google_token_expires_at");
    table.dropColumn("google_customer_id");
    table.dropColumn("google_customer_name");
    table.dropColumn("google_manager_account_id");
    table.dropColumn("google_manager_account_name");
  });
};
