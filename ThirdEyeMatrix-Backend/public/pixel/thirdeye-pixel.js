(function (window, document) {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }

  const storageAvailable = (type) => {
    try {
      const storage = window[type];
      const testKey = '__tem_test__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };

  const localStoreEnabled = storageAvailable('localStorage');
  const sessionStoreEnabled = storageAvailable('sessionStorage');

  const STORAGE_KEYS = {
    visitor: 'tem_visitor_id',
    session: 'tem_session_id',
    sessionActivity: 'tem_session_activity',
    utm: 'tem_utm_params',
    identity: 'tem_identity_traits',
  };

  const toJson = (value, fallback = null) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  };

  const fromStorage = (key, type = 'local') => {
    try {
      if (type === 'session' && sessionStoreEnabled) {
        return sessionStorage.getItem(key);
      }
      if (localStoreEnabled) {
        return localStorage.getItem(key);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const toStorage = (key, value, type = 'local') => {
    try {
      if (type === 'session' && sessionStoreEnabled) {
        sessionStorage.setItem(key, value);
        return;
      }
      if (localStoreEnabled) {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      /* ignore */
    }
  };

  const removeStorage = (key, type = 'local') => {
    try {
      if (type === 'session' && sessionStoreEnabled) {
        sessionStorage.removeItem(key);
        return;
      }
      if (localStoreEnabled) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      /* ignore */
    }
  };

  const uuid = () => {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    const random = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${random()}${random()}-${random()}-${random()}-${random()}-${random()}${random()}${random()}`;
  };

  const now = () => new Date().toISOString();

  const pick = (object, keys) => {
    const result = {};
    keys.forEach((key) => {
      if (object && Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined) {
        result[key] = object[key];
      }
    });
    return result;
  };

  const parseUtm = () => {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const utm = {
      source: params.get('utm_source') || params.get('source') || undefined,
      medium: params.get('utm_medium') || params.get('medium') || undefined,
      campaign: params.get('utm_campaign') || params.get('campaign') || undefined,
      content: params.get('utm_content') || params.get('content') || undefined,
      term: params.get('utm_term') || params.get('term') || undefined,
    };

    const hasValues = Object.values(utm).some((value) => Boolean(value));

    if (!hasValues) {
      return null;
    }

    return utm;
  };

  const resolveScriptElement = () => {
    const current = document.currentScript;
    if (current) return current;

    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i -= 1) {
      const script = scripts[i];
      if (script && /thirdeye-pixel\.js/.test(script.src)) {
        return script;
      }
    }
    return null;
  };

  const scriptEl = resolveScriptElement();
  const scriptDataset = scriptEl ? scriptEl.dataset || {} : {};

  const resolveApiBase = () => {
    const datasetBase = scriptDataset.apiBase || scriptDataset.endpoint || scriptDataset.baseUrl;
    if (datasetBase) {
      return datasetBase.replace(/\/$/, '');
    }

    if (scriptEl && scriptEl.src) {
      try {
        const url = new URL(scriptEl.src);
        return `${url.protocol}//${url.host}`;
      } catch (error) {
        return window.location.origin;
      }
    }

    return window.location.origin;
  };

  const apiBase = resolveApiBase();
  const collectEndpoint = `${apiBase}/api/pixel/collect`;

  const SESSION_TIMEOUT_MS = (scriptDataset.sessionTimeoutMinutes
    ? parseInt(scriptDataset.sessionTimeoutMinutes, 10)
    : 30) * 60 * 1000;

  const state = {
    visitorId: null,
    sessionId: null,
    identity: null,
    utm: null,
    queue: [],
    sending: false,
    lastActivity: null,
  };

  const loadStateFromStorage = () => {
    state.visitorId = fromStorage(STORAGE_KEYS.visitor) || null;
    state.sessionId = fromStorage(STORAGE_KEYS.session, 'session') || null;
    state.lastActivity = fromStorage(STORAGE_KEYS.sessionActivity, 'session');
    state.identity = toJson(fromStorage(STORAGE_KEYS.identity)) || null;
    state.utm = toJson(fromStorage(STORAGE_KEYS.utm)) || null;
  };

  const persistVisitorId = (visitorId) => {
    state.visitorId = visitorId;
    toStorage(STORAGE_KEYS.visitor, visitorId);
  };

  const persistSessionId = (sessionId) => {
    state.sessionId = sessionId;
    toStorage(STORAGE_KEYS.session, sessionId, 'session');
  };

  const persistActivity = (timestamp) => {
    state.lastActivity = timestamp;
    toStorage(STORAGE_KEYS.sessionActivity, timestamp, 'session');
  };

  const persistUTM = (utm) => {
    state.utm = utm;
    if (utm) {
      toStorage(STORAGE_KEYS.utm, JSON.stringify(utm));
    } else {
      removeStorage(STORAGE_KEYS.utm);
    }
  };

  const persistIdentity = (identity) => {
    state.identity = identity;
    if (identity) {
      toStorage(STORAGE_KEYS.identity, JSON.stringify(identity));
    } else {
      removeStorage(STORAGE_KEYS.identity);
    }
  };

  const ensureVisitorId = () => {
    if (!state.visitorId) {
      persistVisitorId(uuid());
    }
    return state.visitorId;
  };

  const ensureSessionId = () => {
    const last = state.lastActivity ? new Date(state.lastActivity).getTime() : 0;
    const nowTs = Date.now();

    if (!state.sessionId || !last || nowTs - last > SESSION_TIMEOUT_MS) {
      persistSessionId(uuid());
    }

    persistActivity(now());
    return state.sessionId;
  };

  const detectDevice = () => {
    const navigatorInfo = window.navigator || {};
    const screenInfo = window.screen || {};
    const timezone = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch (error) {
        return undefined;
      }
    })();

    const ua = navigatorInfo.userAgent || '';
    const deviceType = /mobile/i.test(ua)
      ? 'mobile'
      : /tablet/i.test(ua)
      ? 'tablet'
      : 'desktop';

    return {
      userAgent: ua,
      language: navigatorInfo.language || navigatorInfo.userLanguage,
      deviceType,
      deviceVendor: navigatorInfo.vendor,
      platform: navigatorInfo.platform,
      browser: navigatorInfo.userAgentData && navigatorInfo.userAgentData.brands
        ? navigatorInfo.userAgentData.brands.map((brand) => brand.brand).join(', ')
        : undefined,
      os: navigatorInfo.userAgentData && navigatorInfo.userAgentData.platform,
      screenWidth: screenInfo.width,
      screenHeight: screenInfo.height,
      colorDepth: screenInfo.colorDepth,
      timezone,
    };
  };

  const detectPage = (overrides = {}) => {
    const location = window.location || {};
    return {
      url: overrides.url || location.href,
      path: overrides.path || location.pathname,
      title: overrides.title || document.title,
      referrer: overrides.referrer || document.referrer,
      searchTerm: overrides.searchTerm,
    };
  };

  const deduceSearchTerm = () => {
    const url = new URL(window.location.href);
    return url.searchParams.get('search') || url.searchParams.get('q') || undefined;
  };

  const enqueue = (payload, options = {}) => {
    state.queue.push({ payload, options });
    flushQueue();
  };

  const sendWithFetch = (body, keepalive = false) => {
    return fetch(collectEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive,
      credentials: 'omit',
    });
  };

  const sendWithBeacon = (body) => {
    try {
      return navigator.sendBeacon(collectEndpoint, body);
    } catch (error) {
      return false;
    }
  };

  const updateIdentifiersFromResponse = async (response) => {
    try {
      const data = await response.json();
      if (data.visitorId) {
        persistVisitorId(data.visitorId);
      }
      if (data.sessionId) {
        persistSessionId(data.sessionId);
      }
    } catch (error) {
      /* ignore json errors */
    }
  };

  const flushQueue = () => {
    if (state.sending || !state.queue.length) {
      return;
    }

    const item = state.queue.shift();
    const body = JSON.stringify(item.payload);
    state.sending = true;

    sendWithFetch(body, item.options.keepalive)
      .then((response) => {
        if (response && response.ok) {
          updateIdentifiersFromResponse(response);
        }
      })
      .catch(() => {
        // Re-queue on failure
        state.queue.unshift(item);
      })
      .finally(() => {
        state.sending = false;
        if (state.queue.length) {
          flushQueue();
        }
      });
  };

  const buildPayload = (eventName, properties = {}, options = {}) => {
    const visitorId = ensureVisitorId();
    const sessionId = ensureSessionId();
    const timestamp = new Date().toISOString();
    const utm = state.utm || parseUtm();
    if (utm) {
      persistUTM(utm);
    }

    const device = detectDevice();
    const page = detectPage(options.page || {});

    const visitor = {
      visitorId,
      email: state.identity && state.identity.email,
      phone: state.identity && state.identity.phone,
      firstName: state.identity && state.identity.firstName,
      lastName: state.identity && state.identity.lastName,
      traits: state.identity && state.identity.traits,
    };

    const event = {
      name: eventName,
      properties,
      timestamp,
      value: properties.value,
      currency: properties.currency,
      orderId: properties.order_id || properties.orderId,
      subscriptionId: properties.subscription_id || properties.subscriptionId,
      searchTerm: properties.searchTerm || page.searchTerm || deduceSearchTerm(),
      isConversion: Boolean(options.isConversion || properties.isConversion),
      items: properties.items,
    };

    if (options.eventId) {
      event.eventId = options.eventId;
    }

    const sessionPayload = {
      sessionId,
    };

    return {
      visitor,
      session: sessionPayload,
      event,
      page,
      device,
      utm,
    };
  };

  const track = (eventName, properties = {}, options = {}) => {
    if (typeof eventName !== 'string' || !eventName) {
      return;
    }

    const payload = buildPayload(eventName, properties, options);
    enqueue(payload);
  };

  const identify = (identity = {}) => {
    const traits = pick(identity, ['email', 'phone', 'firstName', 'lastName']);
    const additionalTraits = identity.traits || {};

    const merged = {
      ...state.identity,
      ...traits,
      traits: {
        ...(state.identity && state.identity.traits ? state.identity.traits : {}),
        ...additionalTraits,
      },
    };

    persistIdentity(merged);

    if (identity.address) {
      merged.traits = merged.traits || {};
      merged.traits.address = identity.address;
    }

    const payload = buildPayload('Contact', { traits: merged.traits }, { isConversion: false });
    payload.visitor = {
      ...payload.visitor,
      ...traits,
      traits: merged.traits,
    };

    enqueue(payload);
  };

  const page = (properties = {}) => {
    const payload = buildPayload('PageView', properties, { eventId: uuid() });
    enqueue(payload);
  };

  const trackCheckoutEvent = (stage, properties = {}) => {
    track(stage, properties, { isConversion: stage === 'Purchase' || stage === 'OrderCompleted' });
  };

  const flushImmediately = () => {
    if (!state.queue.length) {
      return;
    }

    const items = state.queue.splice(0, state.queue.length);
    items.forEach((item) => {
      const body = JSON.stringify(item.payload);
      if (!sendWithBeacon(body)) {
        sendWithFetch(body, true);
      }
    });
  };

  const bootstrap = () => {
    loadStateFromStorage();
    ensureVisitorId();
    ensureSessionId();

    const utm = parseUtm();
    if (utm) {
      persistUTM(utm);
    }

    const productContext = window.ThirdEyePixelData || window.TriplePixelData || {};

    const pageProperties = {
      ...productContext,
      value: productContext.price,
      currency: productContext.currency,
    };

    page(pageProperties);
  };

  window.ThirdEyePixel = window.ThirdEyePixel || {
    track,
    page,
    identify,
    trackCheckoutEvent,
    flush: flushImmediately,
    getState: () => ({
      visitorId: state.visitorId,
      sessionId: state.sessionId,
      utm: state.utm,
      identity: state.identity,
    }),
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrap();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrap);
  }

  window.addEventListener('beforeunload', flushImmediately);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushImmediately();
    } else if (document.visibilityState === 'visible') {
      persistActivity(now());
    }
  });

  window.addEventListener('focus', () => {
    ensureSessionId();
  });

  window.addEventListener('pagehide', flushImmediately);
})(window, document);

