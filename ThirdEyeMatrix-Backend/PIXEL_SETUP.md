# Third Eye Pixel Tracking

This document explains how to configure and use the **Third Eye Pixel**, a first-party analytics and attribution pixel inspired by Triple Whale. The implementation spans the Express backend (event ingestion, storage, metrics) and the Next.js frontend (client-side pixel loader + hook).

---

## Key Capabilities

- **Visitor & Session Identity**: persistent visitor IDs, session lifecycle handling (30 min inactivity timeout by default), optional identity enrichment via `identify` calls (email, phone, name, traits).
- **Page & Navigation Tracking**: automatic `PageView` events with URL, referrer, and inferred search term. UTM parameters are persisted for multi-touch attribution.
- **Event Tracking**: generic `track` API for standard ecommerce events (`AddToCart`, `InitiateCheckout`, `Purchase`, etc.) and custom events with arbitrary properties or item payloads.
- **Touchpoint Attribution**: UTM/touchpoint records stored per session for multi-touch journey reconstruction.
- **Ecommerce Metrics**: revenue, conversion counts, session/page summaries, and journey reconstruction endpoints for analytics dashboards.

---

## Backend Components

### Database Schema

Migrations add four Postgres tables:

1. `pixel_visitors` – visitor identity and enrichment fields (email, phone, traits).
2. `pixel_sessions` – session metadata, device details, UTM snapshot, activity counters.
3. `pixel_touchpoints` – ordered list of marketing touchpoints (UTM source, medium, campaign, etc.).
4. `pixel_events` – canonical event store with properties JSON payload.

> Run `npm run db:migrate` (within `ThirdEyeMatrix-Backend`) after deploying to apply the schema.

### REST Endpoints

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `POST` | `/api/pixel/collect` | Ingests a single event with visitor/session/context payloads. Returns authoritative `visitorId` and `sessionId` for the client. |
| `GET`  | `/api/pixel/metrics?start=<ISO>&end=<ISO>` | Aggregated KPI summary (events, visitors, sessions, conversions, revenue, session averages, recent events). Defaults to trailing 7 days if query params omitted. |
| `GET`  | `/api/pixel/visitors/:visitorId/journey` | Full visitor journey (sessions, ordered events, touchpoints). Accepts internal UUID or external ID. |

The router is mounted at `/api/pixel` inside `src/server.js`. CORS now supports wildcard configuration via the `CORS_ORIGINS` environment variable (comma-delimited, `*` allowed).

### Configuration

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `CORS_ORIGINS` | Optional comma-separated list of allowed origins. Use `*` to mirror any origin (suitable for pixel collection). | `*` |

---

## Frontend Components

### Script Loader

- `src/components/ThirdEyePixelLoader.tsx` dynamically appends the pixel script on the client.
- Injected globally from `src/app/layout.tsx` so every route triggers pixel bootstrap.
- Uses `NEXT_PUBLIC_PIXEL_BASE_URL` (should point to your backend origin, e.g. `https://api.example.com`). Optional `NEXT_PUBLIC_PIXEL_SESSION_TIMEOUT_MINUTES` overrides the 30-minute inactivity window.

### React Hook

- `useThirdEyePixel` hook provides thin wrappers that safely call the pixel API once the script is loaded.
- Example usage:

```tsx
'use client';
import { useThirdEyePixel } from '@/hooks/useThirdEyePixel';

const AddToCartButton = ({ product }) => {
  const { track } = useThirdEyePixel();

  return (
    <button
      onClick={() =>
        track('AddToCart', {
          product_id: product.id,
          product_name: product.title,
          price: product.price,
          quantity: 1,
        })
      }
    >
      Add to cart
    </button>
  );
};
```

### Global Definitions

`src/global.d.ts` now includes the `ThirdEyePixel` typings, avoiding TypeScript errors when referencing `window.ThirdEyePixel`.

### Raw Pixel Script

`public/pixel/thirdeye-pixel.js` runs in the browser:

- Generates/stores visitor & session IDs in storage (anonymous).
- Automatically tracks `PageView` on load, queues events, flushes via `fetch`/`sendBeacon`.
- Persists UTM parameters, device info, and exposes `track`, `page`, `identify`, `trackCheckoutEvent`, `flush`, and `getState` helpers.
- Interoperates with optional `window.ThirdEyePixelData` (or legacy `window.TriplePixelData`) for ecommerce page context.

Embedding snippet for non-Next projects:

```html
<script
  async
  defer
  src="https://vanna-churlish-florencia.ngrok-free.dev/pixel/thirdeye-pixel.js"
  data-api-base="https://vanna-churlish-florencia.ngrok-free.dev"
  data-session-timeout-minutes="30"
></script>
```

---

## Data Payload Structure

`POST /api/pixel/collect` expects the following shape (client handled automatically by the loader):

```json
{
  "visitor": {
    "visitorId": "uuid",
    "email": "optional",
    "phone": "optional",
    "firstName": "optional",
    "lastName": "optional",
    "traits": { "custom": "values" }
  },
  "session": { "sessionId": "uuid" },
  "event": {
    "name": "AddToCart",
    "timestamp": "ISO",
    "value": 123.45,
    "currency": "USD",
    "orderId": "optional",
    "searchTerm": "optional",
    "properties": { "any": "thing" },
    "items": [ { "product_id": "sku", "price": 12.5, "quantity": 1 } ]
  },
  "page": { "url": "https://...", "referrer": "https://...", "searchTerm": "..." },
  "device": { "userAgent": "...", "deviceType": "desktop", "screenWidth": 1440, "screenHeight": 900 },
  "utm": { "source": "google", "medium": "cpc", "campaign": "brand" }
}
```

Server responses include authoritative identifiers:

```json
{
  "message": "Event captured",
  "visitorId": "uuid",
  "sessionId": "uuid",
  "eventId": "uuid"
}
```

---

## Verification Checklist

1. **Environment**
   - Set `NEXT_PUBLIC_PIXEL_BASE_URL` in the frontend env (e.g., `.env.local`).
   - Optionally set `CORS_ORIGINS` and `NEXT_PUBLIC_PIXEL_SESSION_TIMEOUT_MINUTES`.

2. **Database**
   - Run migrations: `cd ThirdEyeMatrix-Backend && npm run db:migrate`.
   - Verify new tables exist: `\d pixel_events` (via psql) or DB GUI.

3. **Smoke Test**
   - Start backend (`npm start`) and frontend.
   - Load any page; confirm `PageView` events stored in `pixel_events`.
   - Use browser console: `window.ThirdEyePixel.track('AddToCart', { product_id: 'sku123', price: 49.99 });`
   - Verify new event row + session counters update.

4. **Metrics Endpoint**
   - Call `GET /api/pixel/metrics` and ensure JSON summary is returned.
   - Call `GET /api/pixel/visitors/<visitorId>/journey` using ID captured from response for full journey.

---

## Limitations & Considerations

- Does **not** collect sensitive payment details (credit card numbers) by design.
- Cannot backfill historical data prior to script install.
- Subject to browser privacy constraints (ITP, ad blockers, cookie restrictions). Expect occasional unmatched sessions despite ID graph attempts.
- Attribution requires correctly tagged campaign URLs (UTMs). Missing tags lead to `direct` attribution.
- For production, consider rate limiting, bot filtering, encryption of personally identifiable information (PII), and GDPR/CCPA compliance workflows (consent, deletion APIs).

---

## Next Steps

- Build dashboards that consume `pixel_events` and `pixel_sessions` (e.g., via Superset or custom React charts).
- Extend the ingest pipeline for server-side events or POS data.
- Implement webhooks/exports to sync enriched conversions back to ad platforms.

