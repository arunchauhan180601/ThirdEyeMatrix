const knex = require('knex')(require('../../../knexfile').development);
const { randomUUID } = require('crypto');

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 60 minutes

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );

const sanitizeNullable = (value) => (value === undefined || value === '' ? null : value);

const compactObject = (obj = {}) => {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const cleaned = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    cleaned[key] = value;
  });
  return cleaned;
};

const hasAnyValue = (obj = {}) => Object.values(obj || {}).some((value) => value !== undefined && value !== null && value !== '');

const buildIdentityTraits = ({ traits = {}, address = {} }) => {
  const cleanedTraits = compactObject(traits);
  if (hasAnyValue(address)) {
    cleanedTraits.address = compactObject(address);
  }
  return Object.keys(cleanedTraits).length ? cleanedTraits : null;
};

const mergeJson = (existing, incoming) => {
  if (!existing && !incoming) return null;
  return { ...(existing || {}), ...(incoming || {}) };
};

const coerceDate = (value, fallback = new Date()) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const calculateSessionDurationRaw = (trx, timestamp) =>
  trx.raw('EXTRACT(EPOCH FROM (?::timestamptz - started_at))::int', [timestamp.toISOString()]);

const ensureVisitor = async (trx, visitorPayload = {}, eventTimestamp) => {
  const {
    visitorId,
    externalId,
    email,
    phone,
    firstName,
    lastName,
    traits,
    address,
  } = visitorPayload;

  // console.log(visitorId , email , phone , firstName, lastName);

  const now = eventTimestamp || new Date();

  let visitorRecord = null;

  if (visitorId && isUuid(visitorId)) {
    visitorRecord = await trx('pixel_visitors').where({ id: visitorId }).first();
  }

  if (!visitorRecord && visitorId) {
    visitorRecord = await trx('pixel_visitors').where({ external_id: visitorId }).first();
  }

  if (!visitorRecord && externalId) {
    visitorRecord = await trx('pixel_visitors').where({ external_id: externalId }).first();
  }

  const identityTraits = buildIdentityTraits({ traits, address });

  if (!visitorRecord) {
    const generatedVisitorId = isUuid(visitorId) ? visitorId : randomUUID();
    const [createdVisitor] = await trx('pixel_visitors')
      .insert({
        id: generatedVisitorId,
        external_id: sanitizeNullable(!isUuid(visitorId) ? visitorId : externalId),
        email: sanitizeNullable(email),
        phone: sanitizeNullable(phone),
        first_name: sanitizeNullable(firstName),
        last_name: sanitizeNullable(lastName),
        identity_traits: identityTraits,
        first_seen_at: now,
        last_seen_at: now,
      })
      .returning('*');

    return createdVisitor;
  }

  const updatePayload = {
    last_seen_at: now,
    updated_at: trx.fn.now(),
  };

  if (email) {
    updatePayload.email = email;
  }
  if (phone) {
    updatePayload.phone = phone;
  }
  if (firstName) {
    updatePayload.first_name = firstName;
  }
  if (lastName) {
    updatePayload.last_name = lastName;
  }
  if (identityTraits) {
    updatePayload.identity_traits = mergeJson(visitorRecord.identity_traits, identityTraits);
  }

  if (externalId && !visitorRecord.external_id) {
    updatePayload.external_id = externalId;
  }

  const [updatedVisitor] = await trx('pixel_visitors')
    .where({ id: visitorRecord.id })
    .update(updatePayload)
    .returning('*');

  return updatedVisitor;
};

const createSession = async (trx, visitorId, { page = {}, device = {}, utm = {}, ip, eventTimestamp }) => {
  const sessionId = randomUUID();
  const startedAt = eventTimestamp || new Date();

  const screenResolution = device.screenWidth && device.screenHeight ? `${device.screenWidth}x${device.screenHeight}` : null;

  const [session] = await trx('pixel_sessions')
    .insert({
      id: sessionId,
      visitor_id: visitorId,
      started_at: startedAt,
      last_event_at: startedAt,
      event_count: 0,
      page_views_count: 0,
      device_type: sanitizeNullable(device.deviceType),
      device_vendor: sanitizeNullable(device.deviceVendor),
      browser: sanitizeNullable(device.browser),
      os: sanitizeNullable(device.os),
      language: sanitizeNullable(device.language || device.locale),
      screen_resolution: sanitizeNullable(screenResolution),
      timezone: sanitizeNullable(device.timezone),
      user_agent: sanitizeNullable(device.userAgent),
      ip_address: sanitizeNullable(ip),
      initial_page_url: sanitizeNullable(page.url),
      initial_referrer: sanitizeNullable(page.referrer),
      utm_params: hasAnyValue(utm) ? utm : null,
    })
    .returning('*');

  return session;
};

const ensureSession = async (trx, visitorId, sessionPayload = {}, context = {}) => {
  const { sessionId } = sessionPayload;
  const eventTimestamp = context.eventTimestamp || new Date();
  let session = null;

  if (sessionId && isUuid(sessionId)) {
    session = await trx('pixel_sessions')
      .where({ id: sessionId, visitor_id: visitorId })
      .first();
  }

  if (session) {
    const lastEventAt = session.last_event_at ? new Date(session.last_event_at) : null;
    if (lastEventAt && eventTimestamp.getTime() - lastEventAt.getTime() > SESSION_TIMEOUT_MS) {
      return {
        session: await createSession(trx, visitorId, context),
        isNew: true,
      };
    }

    return {
      session,
      isNew: false,
    };
  }

  return {
    session: await createSession(trx, visitorId, context),
    isNew: true,
  };
};

const recordTouchpoint = async (trx, visitorId, sessionId, utm = {}, eventTimestamp) => {
  if (!hasAnyValue(utm)) {
    return null;
  }

  const candidate = await trx('pixel_touchpoints')
    .where({
      visitor_id: visitorId,
      session_id: sessionId,
      source: sanitizeNullable(utm.source),
      medium: sanitizeNullable(utm.medium),
      campaign: sanitizeNullable(utm.campaign),
      term: sanitizeNullable(utm.term),
      content: sanitizeNullable(utm.content),
    })
    .first();

  if (candidate) {
    return candidate;
  }

  const [touchpoint] = await trx('pixel_touchpoints')
    .insert({
      visitor_id: visitorId,
      session_id: sessionId,
      occurred_at: eventTimestamp,
      source: sanitizeNullable(utm.source),
      medium: sanitizeNullable(utm.medium),
      campaign: sanitizeNullable(utm.campaign),
      content: sanitizeNullable(utm.content),
      term: sanitizeNullable(utm.term),
      metadata: hasAnyValue(utm) ? utm : null,
    })
    .returning('*');

  return touchpoint;
};

const updateSessionStats = async (trx, sessionId, eventName, eventTimestamp) => {
  const updates = {
    last_event_at: eventTimestamp,
    ended_at: eventTimestamp,
    session_duration_seconds: calculateSessionDurationRaw(trx, eventTimestamp),
    updated_at: trx.fn.now(),
  };

  await trx('pixel_sessions').where({ id: sessionId }).update(updates);
  await trx('pixel_sessions').where({ id: sessionId }).increment('event_count', 1);

  if (eventName === 'PageView') {
    await trx('pixel_sessions').where({ id: sessionId }).increment('page_views_count', 1);
  }
};

exports.collectEvent = async (req, res) => {
  const {
    visitor = {},
    session = {},
    event = {},
    page = {},
    device = {},
    utm = {},
    touchpoint,
  } = req.body || {};

  if (!event.name) {
    return res.status(400).json({ message: 'event.name is required' });
  }

  const eventTimestamp = coerceDate(event.timestamp, new Date());

  try {
    const result = await knex.transaction(async (trx) => {
      const visitorRecord = await ensureVisitor(trx, visitor, eventTimestamp);

      const context = {
        page,
        device,
        utm,
        ip: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        eventTimestamp,
      };

      const { session: sessionRecord } = await ensureSession(trx, visitorRecord.id, session, context);

      if (touchpoint || hasAnyValue(utm)) {
        await recordTouchpoint(
          trx,
          visitorRecord.id,
          sessionRecord.id,
          touchpoint || utm,
          eventTimestamp
        );
      }

      const eventPayload = {
        visitor_id: visitorRecord.id,
        session_id: sessionRecord.id,
        occurred_at: eventTimestamp,
        name: event.name,
        source_type: sanitizeNullable(event.sourceType),
        page_url: sanitizeNullable(page.url),
        referrer: sanitizeNullable(page.referrer),
        search_term: sanitizeNullable(event.searchTerm || page.searchTerm),
        order_id: sanitizeNullable(event.orderId),
        subscription_id: sanitizeNullable(event.subscriptionId),
        value: sanitizeNullable(event.value),
        currency: sanitizeNullable(event.currency || device.currency),
        is_conversion: Boolean(event.isConversion || ['Purchase', 'OrderCompleted'].includes(event.name)),
        properties: event.properties && Object.keys(event.properties).length ? event.properties : null,
        items: Array.isArray(event.items) && event.items.length ? event.items : null,
        identity_snapshot: {
          email: sanitizeNullable(visitor.email || visitorRecord.email),
          phone: sanitizeNullable(visitor.phone || visitorRecord.phone),
          first_name: sanitizeNullable(visitor.firstName || visitorRecord.first_name),
          last_name: sanitizeNullable(visitor.lastName || visitorRecord.last_name),
        },
      };

      if (event.eventId && isUuid(event.eventId)) {
        eventPayload.id = event.eventId;
      }

      const [storedEvent] = await trx('pixel_events').insert(eventPayload).returning('*');

      await updateSessionStats(trx, sessionRecord.id, event.name, eventTimestamp);

      return {
        visitorId: visitorRecord.id,
        sessionId: sessionRecord.id,
        eventId: storedEvent.id,
      };
    });

    return res.status(201).json({
      message: 'Event captured',
      ...result,
    });
  } catch (error) {
    console.error('Error collecting pixel event:', error);
    return res.status(500).json({ message: 'Failed to collect event', error: error.message });
  }
};

exports.getMetrics = async (req, res) => {
  const { start, end } = req.query;
  const endDate = coerceDate(end, new Date());
  const defaultStart = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startDate = coerceDate(start, defaultStart);

  try {
    const [eventSummary] = await knex('pixel_events')
      .whereBetween('occurred_at', [startDate, endDate])
      .select(
        knex.raw('COUNT(*)::int as total_events'),
        knex.raw('COUNT(DISTINCT visitor_id)::int as unique_visitors'),
        knex.raw('COUNT(DISTINCT session_id)::int as sessions'),
        knex.raw('SUM(CASE WHEN is_conversion THEN 1 ELSE 0 END)::int as conversions'),
        knex.raw('COALESCE(SUM(value), 0)::float as total_revenue')
      );

    const [sessionSummary] = await knex('pixel_sessions')
      .whereBetween('started_at', [startDate, endDate])
      .select(
        knex.raw('COALESCE(AVG(session_duration_seconds), 0)::float as avg_session_duration_seconds'),
        knex.raw('COALESCE(AVG(page_views_count), 0)::float as avg_pages_per_session'),
        knex.raw('COALESCE(SUM(page_views_count), 0)::int as total_page_views')
      );

    const conversionRate = eventSummary.sessions
      ? Number((eventSummary.conversions / eventSummary.sessions).toFixed(4))
      : 0;

    const revenuePerVisitor = eventSummary.unique_visitors
      ? Number((eventSummary.total_revenue / eventSummary.unique_visitors).toFixed(4))
      : 0;

    const recentEvents = await knex('pixel_events')
      .whereBetween('occurred_at', [startDate, endDate])
      .orderBy('occurred_at', 'desc')
      .limit(50)
      .select(
        'id',
        'occurred_at',
        'name',
        'value',
        'currency',
        'page_url',
        'referrer',
        'visitor_id',
        'session_id'
      );

    return res.status(200).json({
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      metrics: {
        total_events: eventSummary.total_events,
        unique_visitors: eventSummary.unique_visitors,
        sessions: eventSummary.sessions,
        conversions: eventSummary.conversions,
        total_revenue: eventSummary.total_revenue,
        avg_session_duration_seconds: sessionSummary.avg_session_duration_seconds,
        avg_pages_per_session: sessionSummary.avg_pages_per_session,
        total_page_views: sessionSummary.total_page_views,
        conversion_rate: conversionRate,
        revenue_per_visitor: revenuePerVisitor,
      },
      recent_events: recentEvents,
    });
  } catch (error) {
    console.error('Error fetching pixel metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch metrics', error: error.message });
  }
};

exports.getVisitorJourney = async (req, res) => {
  const { visitorId } = req.params;

  if (!visitorId) {
    return res.status(400).json({ message: 'visitorId is required' });
  }

  try {
    let visitorRecord = null;

    if (isUuid(visitorId)) {
      visitorRecord = await knex('pixel_visitors').where({ id: visitorId }).first();
    }

    if (!visitorRecord) {
      visitorRecord = await knex('pixel_visitors').where({ external_id: visitorId }).first();
    }

    if (!visitorRecord) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    const sessions = await knex('pixel_sessions')
      .where({ visitor_id: visitorRecord.id })
      .orderBy('started_at', 'asc');

    const events = await knex('pixel_events')
      .where({ visitor_id: visitorRecord.id })
      .orderBy('occurred_at', 'asc');

    const touchpoints = await knex('pixel_touchpoints')
      .where({ visitor_id: visitorRecord.id })
      .orderBy('occurred_at', 'asc');

    const sessionsById = sessions.reduce((acc, session) => {
      acc[session.id] = { ...session, events: [] };
      return acc;
    }, {});

    events.forEach((eventItem) => {
      if (eventItem.session_id && sessionsById[eventItem.session_id]) {
        sessionsById[eventItem.session_id].events.push(eventItem);
      }
    });

    const journey = Object.values(sessionsById);

    return res.status(200).json({
      visitor: visitorRecord,
      sessions: journey,
      touchpoints,
    });
  } catch (error) {
    console.error('Error fetching visitor journey:', error);
    return res.status(500).json({ message: 'Failed to fetch visitor journey', error: error.message });
  }
};

