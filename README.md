# PagePulse

Production-grade URL audit service with caching, rate limiting, and structured logging.

## Live URL

**https://page-pulse.onrender.com** (update after deployment)

## Features

- **Input validation** — SSRF protection, URL format checks, configurable timeouts
- **Caching** — Configurable TTL window, repeat audits served from cache
- **Rate limiting** — Per-client request limits with standard headers
- **Structured logging** — Pino JSON logs with request IDs
- **Error handling** — Consistent JSON error envelopes with `requestId` and `timestamp`

## API Contract

### `POST /api/audit`

Audit a URL and return structured HTML data.

**Request:**
```json
{
  "url": "https://example.com",
  "options": {
    "timeout": 10000,
    "maxRedirects": 5
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "auditedAt": "2026-07-24T20:42:00.000Z",
    "cached": false,
    "fetchStatus": "success",
    "fetchStatusCode": 200,
    "fetchResponseTimeMs": 320,
    "data": {
      "title": "Example Domain",
      "metaDescription": null,
      "metaViewport": "width=device-width, initial-scale=1",
      "metaRobots": null,
      "canonicalUrl": null,
      "openGraph": { "title": null, "description": null, "image": null, "url": null },
      "twitterCard": { "card": null, "title": null, "description": null, "image": null },
      "headings": { "h1": ["Example Domain"], "h2": [], "h3": [] },
      "linkCount": 1,
      "imageCount": 0,
      "imageAltMissing": 0,
      "scripts": [],
      "stylesheets": [],
      "hasFavicon": false,
      "pageSizeBytes": 1256,
      "responseTimeMs": 320
    }
  },
  "requestId": "uuid-here",
  "timestamp": "2026-07-24T20:42:00.000Z"
}
```

**Error Response (4xx/5xx):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "requestId": "uuid-here",
    "timestamp": "2026-07-24T20:42:00.000Z",
    "details": [
      {
        "field": "url",
        "message": "URL must use http or https protocol"
      }
    ]
  }
}
```

### `GET /health`

```json
{
  "status": "ok",
  "uptime": 1234.567,
  "timestamp": "2026-07-24T20:42:00.000Z"
}
```

### `GET /api/cache/stats`

```json
{
  "hits": 42,
  "misses": 18,
  "keys": 12,
  "ksize": 1234,
  "vsize": 5678
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input fields |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `FETCH_FAILED` | 502 | Upstream fetch failure |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Build for production
docker build -t page-pulse .
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CACHE_TTL` | `300` | Cache TTL in seconds |
| `CACHE_MAX` | `100` | Max cache entries |
| `CACHE_USE` | `true` | Enable/disable caching |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (1 min) |
| `RATE_LIMIT_MAX` | `10` | Max requests per window |
| `FETCH_TIMEOUT_MS` | `10000` | Fetch timeout (ms) |
| `MAX_CONCURRENT_FETCHES` | `5` | Concurrency limit |
| `NODE_ENV` | `development` | Environment mode |

## Tech Stack

- **Express** — REST API
- **Axios** — HTTP client
- **Cheerio** — HTML parsing
- **NodeCache** — In-memory cache
- **express-rate-limit** — Rate limiting
- **express-validator** — Input validation
- **Pino** — Structured logging
- **Helmet** — Security headers
- **Jest + Supertest** — Testing

## License

MIT
