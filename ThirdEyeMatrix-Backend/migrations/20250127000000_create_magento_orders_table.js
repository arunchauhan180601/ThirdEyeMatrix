/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('magento_orders', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.bigInteger('magento_order_id').notNullable().comment('Unique identifier from Magento');
    table.string('increment_id').nullable().comment('Magento order number');
    table.integer('customer_id').nullable().comment('Customer ID from Magento');
    table.string('customer_firstname').nullable();
    table.string('customer_lastname').nullable();
    table.string('customer_email').nullable();
    table.decimal('grand_total', 10, 2).nullable();
    table.decimal('subtotal', 10, 2).nullable();
    table.decimal('shipping_amount', 10, 2).nullable();
    table.decimal('discount_amount', 10, 2).nullable();
    table.decimal('tax_amount', 10, 2).nullable().comment('Total tax amount');
    table.decimal('total_refunded', 10, 2).nullable().comment('Total refunded amount');
    table.string('status').nullable().comment('Order status');
    table.string('state').nullable().comment('Order state');
    table.string('currency_code', 3).nullable();
    table.timestamp('magento_created_at').nullable().comment('Order creation date from Magento');
    table.timestamp('magento_updated_at').nullable().comment('Order update date from Magento');
    table.jsonb('billing_address').nullable().comment('Full billing address JSON');
    table.jsonb('shipping_address').nullable().comment('Full shipping address JSON');
    table.jsonb('payment').nullable().comment('Payment details JSON');
    table.jsonb('refunds').nullable().comment('Refund details - array of credit memos');
    table.jsonb('tax_details').nullable().comment('Breakdown of taxes per item or region');
    table.jsonb('extension_attributes').nullable().comment('Extension attributes JSON');
    table.jsonb('custom_attributes').nullable().comment('Custom attributes JSON');
    table.timestamps(true, true);

    // Composite unique constraint to prevent duplicate orders per store
    table.unique(['store_id', 'magento_order_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('magento_orders');
};

