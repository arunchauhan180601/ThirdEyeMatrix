
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('shopify_orders', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.string('shopify_order_id').notNullable().comment('Unique identifier from Shopify');
    table.bigInteger('customer_id').nullable().comment('Customer ID from Shopify');
    table.string('customer_firstname').nullable();
    table.string('customer_lastname').nullable();
    table.string('customer_email').nullable();
    table.string('order_number').nullable();
    table.string('name').nullable();
    table.decimal('total_price', 10, 2).nullable();
    table.decimal('total_discounts', 10, 2).nullable();
    table.decimal('total_tax', 10, 2).nullable();
    table.boolean('order_confirmed').nullable().defaultTo(false);
    table.string('financial_status').nullable();
    table.timestamp('shopify_created_at').nullable().comment('Order creation date from Shopify');
    table.jsonb('refunds').nullable().comment('Array of refund objects');
    table.jsonb('shipping_address').nullable().comment('Shipping address object with address1, address2, city, company, country, phone, zip');
    table.jsonb('billing_address').nullable().comment('Billing address object with address1, address2, city, company, country, phone, zip');
    table.jsonb('total_shipping_price_set').nullable().comment('Shipping price set with shop_money and presentment_money');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate orders per store
    table.unique(['store_id', 'shopify_order_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('shopify_orders');
};


