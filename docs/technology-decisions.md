# Technology Decision Record (TDR)

## 1. HTTP Client: Axios (kept) vs. node-fetch (rejected)

| Decision | Kept Axios | Rejected node-fetch |
|----------|-----------|---------------------|
| **Why kept Axios** | Mature ecosystem; built-in `timeout`, `maxRedirects`, and response interceptors; automatic JSON parsing; widely used in existing codebase. | |
| **Why rejected node-fetch** | Native fetch in Node 18+ is faster and zero-dependency, but: (a) requires manual AbortController wiring for timeouts, (b) lacks built-in max-redirects control in older versions, (c) migration cost disproportionate to gain for current scale. | |

## 2. HTML Parser: Cheerio (kept) vs. Playwright (rejected)

| Decision | Kept Cheerio | Rejected Playwright |
|----------|--------------|---------------------|
| **Why kept Cheerio** | Fast, lightweight, server-side jQuery-like API; sufficient for meta tags, headings, and asset counting; 500-burst concurrency is well within its throughput. | |
| **Why rejected Playwright** | Full browser automation; heavy memory footprint (~100MB+ per instance); slower; overkill since we don't need JavaScript execution or visual rendering. | |

## 3. Cache: NodeCache (kept) vs. Redis (rejected)

| Decision | Kept NodeCache | Rejected Redis |
|----------|---------------|----------------|
| **Why kept NodeCache** | Zero external dependencies; in-process speed; LRU eviction built-in; TTL support; adequate for single-instance deployment at 10K/day. | |
| **Why rejected Redis** | Adds operational complexity (separate service, connection pooling, serialization); cache misses are idempotent so cross-instance cache sharing isn't critical at current scale. Worth revisiting if multi-instance cache coordination becomes a requirement. | |

## 4. Rate Limiter: express-rate-limit (kept) vs. Envoy/Istio (rejected)

| Decision | Kept express-rate-limit | Rejected Envoy/Istio |
|----------|------------------------|----------------------|
| **Why kept express-rate-limit** | Runs in application layer; configurable sliding window; exposes standard `RateLimit-*` headers; easy to swap MemoryStore for Redis later. | |
| **Why rejected Envoy/Istio** | Infrastructure-level rate limiting adds complexity; requires sidecar injection or dedicated load balancer config; not justified until we have multiple services needing coordinated limits. | |

## 5. Logging: Pino (kept) vs. Winston (rejected)

| Decision | Kept Pino | Rejected Winston |
|----------|-----------|------------------|
| **Why kept Pino** | Fastest Node.js JSON logger; low overhead at high request rates; native request ID child logger; output-friendly for log aggregators. | |
| **Why rejected Winston** | Slower; more feature-bloat; requires custom formatters for JSON output; not necessary when Pino handles structured logging with better performance. | |

## 6. Hosting: Render (kept) vs. AWS ECS (rejected)

| Decision | Kept Render | Rejected AWS ECS |
|----------|------------|------------------|
| **Why kept Render** | Single-command deploy; built-in HTTPS; auto-scaling configurable; cost-effective for current traffic; managed CI/CD webhooks. | |
| **Why rejected AWS ECS** | Superior scale and control, but: (a) requires VPC, ECR, ALB, IAM setup; (b) operational overhead significantly higher; (c) cost not justified at 10K/day. Revisit if traffic exceeds 100K/day or multi-region is needed. | |

## 7. Concurrency Control: In-process Semaphore (kept) vs. BullMQ (rejected)

| Decision | Kept In-process Semaphore | Rejected BullMQ |
|----------|---------------------------|-----------------|
| **Why kept Semaphore** | Simple, zero-dependency; limits concurrent fetches to prevent upstream saturation; 500-request burst handled via timeout + fail-fast. | |
| **Why rejected BullMQ** | Adds Redis dependency and queue management overhead; unnecessary complexity since fetch operations are idempotent and short-lived. Consider BullMQ if: (a) fetch times exceed 30s, (b) retry logic becomes critical, (c) multiple workers need distributed coordination. | |
