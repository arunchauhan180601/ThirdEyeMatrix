/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table('users', function (table) {
    table.string('otp');         // to store OTP
    table.timestamp('otp_expiry'); // to store expiry time
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
   return knex.schema.table('users', function (table) {
    table.dropColumn('otp');
    table.dropColumn('otp_expiry');
  });
};
