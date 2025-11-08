/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('woocommerce_orders', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.integer('store_id').unsigned().notNullable();
    table.foreign('store_id').references('id').inTable('stores').onDelete('CASCADE');
    table.integer('woo_order_id').unique().notNullable().comment('Unique identifier from WooCommerce');
    table.bigInteger('customer_id').nullable().comment('Customer ID from woocommeerce');
    table.string('order_number', 50).nullable();
    table.string('status', 50).nullable().comment('e.g., completed, pending');
    table.string('currency', 10).nullable();
    table.decimal('total', 10, 2).nullable();
    table.decimal('subtotal', 10, 2).nullable();
    table.decimal('discount_total', 10, 2).nullable();
    table.decimal('discount_tax', 10, 2).nullable();
    table.decimal('shipping_total', 10, 2).nullable();
    table.decimal('shipping_tax', 10, 2).nullable();
    table.decimal('total_tax', 10, 2).nullable();
    table.string('payment_method', 100).nullable();
    table.string('payment_method_title', 255).nullable();
    table.string('transaction_id', 255).nullable();
    table.boolean('prices_include_tax').nullable();
    table.string('created_via', 50).nullable();
    table.text('customer_ip_address').nullable();
    table.timestamp('date_created').nullable();
    table.timestamp('date_modified').nullable();
    table.timestamp('date_paid').nullable();
    table.timestamp('date_completed').nullable();
    
    // JSONB fields for complex data
    table.jsonb('billing').nullable().comment('Full billing address object');
    table.jsonb('shipping').nullable().comment('Full shipping address object');
    table.jsonb('line_items').nullable().comment('Products in the order');
    table.jsonb('fee_lines').nullable().comment('Any fees');
    table.jsonb('refunds').nullable().comment('Refund information');
    
    table.timestamps(true, true);
    
    // Composite unique constraint to prevent duplicate orders per store
    table.unique(['store_id', 'woo_order_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('woocommerce_orders');
};

