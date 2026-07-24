# Failure Mode Analysis

## Scale Context
- 10,000 audits/day ≈ 7 req/sec average, 115 req/min
- Burst: 500 concurrent requests
- SLA: response time < 2s P95

---

## Failure Mode 1: Upstream Target Unavailability

**Description:** Audited websites return 5xx, timeout, or DNS resolution failures. At 10K/day with 500-burst concurrency, a popular target (e.g., `google.com`) could be slow or rate-limit our fetcher.

**Impact:**
- Increased fetch latency → breach of 2s SLA
- Semaphore slots held for timeout duration → queue backlog
- 502 errors returned to clients

**Mitigations:**
- **Per-request timeout** (`FETCH_TIMEOUT_MS` = 10s) with `AbortController` ensures fetches can't hang indefinitely.
- **Semaphore limit** (`MAX_CONCURRENT_FETCHES` = 5) caps outbound connections, preventing connection pool exhaustion.
- **DNS pre-check** resolves hostname before fetch; fails fast on invalid/private IPs.
- **Structured error response** returns `FETCH_FAILED` (502) with `requestId` so clients can retry.
- **Future**: Add circuit breaker pattern (e.g., `opossum`) to stop fetching from consistently failing targets for a cooldown period.

---

## Failure Mode 2: In-Memory Cache Stampede / Memory Pressure

**Description:** Under 500-burst load, multiple instances miss cache simultaneously for the same hot URL, causing redundant fetches. Additionally, accumulated cache entries could exhaust instance memory.

**Impact:**
- Redundant upstream fetches amplify load on target sites
- Memory pressure → Node.js GC pause → latency spikes → SLA breach
- Cache eviction of hot entries under memory pressure

**Mitigations:**
- **Cache key normalization** (SHA-256 of normalized URL) ensures consistent hits.
- **NodeCache LRU eviction** with `CACHE_MAX` (100 entries) bounds memory usage.
- **Short TTL** (`CACHE_TTL` = 300s) ensures stale entries expire quickly.
- **Staggered cache writes**: not implemented yet, but could add single-flight pattern (dedupe concurrent fetches for same key).
- **Future**: Add cache warm-up for top-K URLs; move to Redis for shared cache across instances.

---

## Failure Mode 3: Rate Limiter False Positives / Shared-IP Throttling

**Description:** `express-rate-limit` with MemoryStore uses client IP as key. At 500-burst load behind a load balancer or CDN, all requests may share the same egress IP, causing legitimate clients to be throttled unfairly.

**Impact:**
- `429 Too Many Requests` returned to legitimate users
- Poor customer experience; SLA violation for affected clients
- Rate limit counter reset requires instance restart in MemoryStore mode

**Mitigations:**
- **Client identification**: Accept `X-Forwarded-For` header with trusted proxy config; fall back to direct IP.
- **Higher per-IP limits** for known proxy ranges; custom key generator function.
- **Future**: Switch to Redis-backed rate limiter for cross-instance consistency and configurable key strategies (API key, JWT, IP).

---

## Failure Mode 4: Instance Saturation and Cascading Failure

**Description:** Render (or any PaaS) auto-scales based on CPU/memory. Under sudden 500-burst load, new instances take 30-60s to start. During boot gap, existing instances absorb excess traffic, exceeding their per-request timeout and memory limits.

**Impact:**
- Existing instances become unresponsive
- Health checks fail → load balancer drains instance → fewer instances handle more traffic → cascading failure
- Complete service outage until new instances boot

**Mitigations:**
- **Horizontal autoscaling** with lower threshold (e.g., scale at 70% CPU) and max instance cap to prevent runaway scaling.
- **Graceful degradation**: Under saturation, return `503 Service Unavailable` with `Retry-After` header instead of queuing indefinitely.
- **Request timeout at edge**: Configure load balancer timeout < application timeout to fail fast.
- **Future**: Add queue depth monitoring and reject requests early when queue > threshold.

---

## Failure Mode 5: Dependency Vulnerability / Supply Chain Attack

**Description:** A critical vulnerability in a transitive dependency (Axios, Cheerio, etc.) could be exploited via malicious target sites.

**Impact:**
- RCE, SSRF bypass, or data exfiltration
- Compliance/legal liability
- Service disruption during forced upgrade

**Mitigations:**
- **Dependabot / Renovate** enabled: auto-PR for patch updates; review and merge within 24h.
- **Snyk / npm audit** in CI: fail build on high/critical vulnerabilities.
- **Lock file** (`package-lock.json`) committed; reproducible installs.
- **Minimal dependency surface**: only essential packages; avoid unmaintained libraries.
- **Future**: Pin Axios/Cheerio versions; subscribe to GitHub security advisories.
