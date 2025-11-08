/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
    exports.up = function(knex) {
    return knex.schema.createTable('reports', function(table) {
            table.increments('id').primary();
            table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
            table.integer('store_id').unsigned().notNullable().references('id').inTable('stores').onDelete('CASCADE');
            table.string('report_title');
            table.string('report_frequency').notNullable(); 
            table.string('time_of_day').notNullable();
            table.string('recipients_email',1000).notNullable();
            table.jsonb('selected_metrics').notNullable();
            table.timestamps(true, true);

    });
    };

    /**
     * @param { import("knex").Knex } knex
     * @returns { Promise<void> }
     */
    exports.down = function(knex) {
    return knex.schema.dropTableIfExists('reports');
    };
