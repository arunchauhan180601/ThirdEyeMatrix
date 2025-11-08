/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  return knex.schema
    .createTable('pixel_visitors', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'))
        .comment('Internal visitor identifier');
      table
        .string('external_id', 191)
        .nullable()
        .unique()
        .comment('Optional external ID provided by client applications');
      table
        .timestamp('first_seen_at')
        .defaultTo(knex.fn.now())
        .notNullable();
      table.timestamp('last_seen_at').nullable();
      table.string('email', 320).nullable();
      table.string('phone', 50).nullable();
      table.string('first_name', 120).nullable();
      table.string('last_name', 120).nullable();
      table.jsonb('identity_traits').nullable();
      table.timestamps(true, true);
    })
    .createTable('pixel_sessions', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'));
      table
        .uuid('visitor_id')
        .notNullable()
        .references('id')
        .inTable('pixel_visitors')
        .onDelete('CASCADE');
      table.timestamp('started_at').defaultTo(knex.fn.now()).notNullable();
      table.timestamp('ended_at').nullable();
      table.timestamp('last_event_at').nullable();
      table.integer('page_views_count').defaultTo(0).notNullable();
      table.integer('event_count').defaultTo(0).notNullable();
      table.integer('session_duration_seconds').nullable();
      table.string('device_type', 120).nullable();
      table.string('device_vendor', 120).nullable();
      table.string('browser', 120).nullable();
      table.string('os', 120).nullable();
      table.string('language', 30).nullable();
      table.string('screen_resolution', 30).nullable();
      table.string('timezone', 120).nullable();
      table.string('user_agent').nullable();
      table.string('ip_address', 64).nullable();
      table.string('initial_page_url').nullable();
      table.string('initial_referrer').nullable();
      table.jsonb('utm_params').nullable();
      table.timestamps(true, true);
    })
    .createTable('pixel_touchpoints', function (table) {
      table.increments('id').primary();
      table
        .uuid('visitor_id')
        .notNullable()
        .references('id')
        .inTable('pixel_visitors')
        .onDelete('CASCADE');
      table
        .uuid('session_id')
        .nullable()
        .references('id')
        .inTable('pixel_sessions')
        .onDelete('SET NULL');
      table.timestamp('occurred_at').defaultTo(knex.fn.now()).notNullable();
      table.string('source', 191).nullable();
      table.string('medium', 191).nullable();
      table.string('campaign', 191).nullable();
      table.string('content', 191).nullable();
      table.string('term', 191).nullable();
      table.jsonb('metadata').nullable();
      table.timestamps(true, true);
    })
    .createTable('pixel_events', function (table) {
      table
        .uuid('id')
        .primary()
        .defaultTo(knex.raw('uuid_generate_v4()'));
      table
        .uuid('visitor_id')
        .notNullable()
        .references('id')
        .inTable('pixel_visitors')
        .onDelete('CASCADE');
      table
        .uuid('session_id')
        .nullable()
        .references('id')
        .inTable('pixel_sessions')
        .onDelete('SET NULL');
      table
        .timestamp('occurred_at')
        .defaultTo(knex.fn.now())
        .notNullable();
      table.string('name', 191).notNullable();
      table.string('source_type', 120).nullable();
      table.string('page_url').nullable();
      table.string('referrer').nullable();
      table.string('search_term').nullable();
      table.string('order_id', 191).nullable();
      table.string('subscription_id', 191).nullable();
      table.decimal('value', 14, 4).nullable();
      table.string('currency', 10).nullable();
      table.boolean('is_conversion').defaultTo(false).notNullable();
      table.jsonb('properties').nullable();
      table.jsonb('items').nullable();
      table.jsonb('identity_snapshot').nullable();
      table.timestamps(true, true);
      table.index(['name', 'occurred_at'], 'pixel_events_name_time_idx');
      table.index(['visitor_id', 'occurred_at'], 'pixel_events_visitor_time_idx');
      table.index(['session_id', 'occurred_at'], 'pixel_events_session_time_idx');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('pixel_events');
  await knex.schema.dropTableIfExists('pixel_touchpoints');
  await knex.schema.dropTableIfExists('pixel_sessions');
  await knex.schema.dropTableIfExists('pixel_visitors');
};

