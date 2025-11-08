/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.text("meta_access_token");
    table.text("meta_refresh_token");
    table.timestamp("meta_token_expires_at");
    table.string("meta_business_id");
    table.string("meta_business_name");
    table.string("meta_ad_account_id");
    table.string("meta_ad_account_name");
    table.string("meta_attribution_window"); // e.g. "7d_click_1d_view"
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable("stores", function(table) {
    table.dropColumn("meta_access_token");
    table.dropColumn("meta_refresh_token");
    table.dropColumn("meta_token_expires_at");
    table.dropColumn("meta_business_id");
    table.dropColumn("meta_business_name");
    table.dropColumn("meta_ad_account_id");
    table.dropColumn("meta_ad_account_name");
    table.dropColumn("meta_attribution_window");
  });
};


