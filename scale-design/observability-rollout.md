# Observability and Rollout Plan

## 1. Monitoring

### 1.1 Golden Signals (RED Method)

| Signal | Metric | Target | Alert Threshold |
|--------|--------|--------|-----------------|
| **Rate** | Requests/sec | 7 avg, 500 burst | > 200 req/s sustained 5m |
| **Errors** | 4xx + 5xx rate | < 1% | > 5% over 2m |
| **Duration** | P95 response time | < 2s | > 3s over 5m |
| **Saturation** | CPU / Memory / Semaphore usage | < 70% | > 85% over 3m |

### 1.2 Application Metrics

| Metric | Source | Purpose |
|--------|--------|---------|
| `audit.cache.hit` | `/api/cache/stats` | Cache effectiveness; alert if hit rate < 20% |
| `audit.cache.miss` | `/api/cache/stats` | Cold-start detection |
| `audit.fetch.duration` | Pino log timing | P50/P95/P99 fetch latency |
| `audit.fetch.status` | Pino log `fetchStatus` | Error rate by status (success/dns_error/timeout) |
| `audit.validator.rejected` | Pino log `statusCode: 400` | Input validation failure rate |
| `audit.rate_limit.hit` | Pino log `statusCode: 429` | Rate limiting effectiveness |
| `audit.semaphore.wait` | Custom metric | Queue depth before semaphore acquisition |

### 1.3 Infrastructure Metrics

| Metric | Source | Purpose |
|--------|--------|---------|
| CPU utilization | Render dashboard | Autoscaling trigger |
| Memory utilization | Render dashboard | OOM prevention |
| Request count | Render dashboard | Traffic pattern analysis |
| Response time | Render dashboard | Confirm P95 SLA |
| Instance count | Render dashboard | Autoscaling efficiency |

### 1.4 Logging

- **Pino structured JSON logs** with fields: `requestId`, `method`, `url`, `statusCode`, `duration`, `fetchStatus`, `cached`, `userAgent`.
- Request ID propagated from middleware → controller → service → fetcher → parser.
- Log aggregation: Render logs → file export or external sink (Logflare, Datadog, Papertrail).
- Sampling: 100% for errors/warnings; 10% for successful requests if volume exceeds capacity.

### 1.5 Alert Rules

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| **SLA Breach** | P95 response time > 3s for 5m | Critical | Page on-call; investigate upstream slowness or instance saturation |
| **Error Rate Spike** | 5xx rate > 5% for 2m | Critical | Check Render health, upstream targets, recent deploys |
| **Rate Limit Saturation** | 429 rate > 30% of total traffic | Warning | Investigate if single IP or CDN causing shared-IP throttling |
| **Cache Collapse** | Cache hit rate < 20% for 10m | Warning | Check TTL, cache size, memory pressure |
| **Instance Saturation** | CPU > 85% for 3m | Warning | Autoscaling should trigger; verify min instances |
| **Deploy Failure** | CI pipeline fails | Warning | Block deploy; notify team |

---

## 2. Alerting Channels

- **Critical**: PagerDuty / OpsGenie → SMS + call to on-call engineer
- **Warning**: Slack `#page-pulse-alerts` channel with daily digest
- **Info**: Render dashboard + weekly Slack summary

---

## 3. Release Rollout Strategy

### 3.1 Deployment Pipeline

```
main branch push
    ↓
GitHub Actions CI (tests + lint)
    ↓
Auto-deploy to Render (staging)
    ↓
Smoke test: curl /health, curl /api/audit
    ↓
Promote to production (manual approval)
    ↓
Canary: 10% traffic for 15m
    ↓
Full rollout: 100% traffic
```

### 3.2 Canary Configuration

- Render doesn't natively support canary; implement via:
  - **Option A**: Deploy canary to separate service (`page-pulse-canary`) behind a feature flag in the load balancer.
  - **Option B**: Use Render's **Preview Deploys** + branch-based routing for controlled rollout.
- Monitor canary for 15m: compare error rate, latency, memory against baseline.

### 3.3 Rollback Triggers

Roll back immediately if any of the following occur during canary or full rollout:

| Condition | Action |
|-----------|--------|
| 5xx rate increase > 2% compared to baseline | Rollback to previous commit |
| P95 latency increase > 1s compared to baseline | Rollback |
| CI test failure post-deploy | Rollback + block further deploys |
| Memory/CPU spike > 2x baseline | Rollback |

---

## 4. Rollback Procedure

### 4.1 Automated Rollback (Render)

```bash
# Render auto-deploys from main branch. To rollback:
# 1. Revert the bad commit locally:
git revert <bad-commit-sha>
git push origin main

# 2. Render detects push and triggers new deploy (previous stable version).
# 3. Monitor /health and /api/cache/stats during rollback.
```

### 4.2 Manual Rollback (Render Dashboard)

1. Navigate to Render dashboard → PagePulse service.
2. Click **"Deploys"** → find last known good deploy.
3. Click **"Redeploy"** on the good commit.
4. Monitor metrics for 5m to confirm stability.

### 4.3 Rollback Checklist

- [ ] Confirm rollback deploy is live (`/health` returns `status: ok`)
- [ ] Verify error rate returns to baseline (< 1%)
- [ ] Verify P95 latency returns to baseline (< 2s)
- [ ] Notify team in Slack `#page-pulse-alerts`
- [ ] Document root cause in incident report

---

## 5. Disaster Recovery

- **Data loss**: No persistent DB; cache-only service. No data loss risk.
- **Instance failure**: Render auto-replaces failed instances; stateless design ensures zero data loss.
- **Deploy failure**: `git revert` + redeploy; < 5 min recovery time.
- **Upstream outage**: Service continues serving cached results; cache TTL ensures eventual consistency.

---

## 6. Runbook Links

- [Render Service Dashboard](https://page-pulse-jk4u.onrender.com)
- [GitHub Actions CI](https://github.com/Ganesh-krish/PagePulse/actions)
- [GitHub Repo](https://github.com/Ganesh-krish/PagePulse)
