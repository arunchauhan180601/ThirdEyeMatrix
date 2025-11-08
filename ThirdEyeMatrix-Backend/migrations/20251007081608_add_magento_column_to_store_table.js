/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.alterTable("stores", function(table) {
    table.text("magento_consumer_key"); 
    table.text("magento_consumer_secret");
    table.text("magento_access_token");
    table.text("magento_access_token_secret");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
   return knex.schema.alterTable("stores", function(table) {
    table.dropColumn("magento_consumer_key"); 
    table.dropColumn("magento_consumer_secret");
    table.dropColumn("magento_access_token");
    table.dropColumn("magento_access_token_secret");
  });
};
