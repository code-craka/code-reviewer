# Code Reviewer AI – Integrated Playbook ( Reviewer Edition)

**Doc version:** 2025‑06‑02
**Scope:** Translate the proven FlowSync RAG pipeline into the Code Reviewer AI product while capturing all cost‑control and caching insights.

---

## 1  Executive Snapshot

Code Reviewer AI piggybacks on the **Retrieval‑Augmented Memory** architecture validated in FlowSync. The result: lightning‑fast, low‑cost AI reviews that “remember” previous feedback yet only hit paid LLM tokens when new context is inevitable.

**North‑star KPIs**
\* Token spend ↓ up to **70 %** within 30 days
\* Median latency < 500 ms (cache hit) / < 900 ms (LLM fallback)
\* P99 review throughput SLA ≥ 99.9 %

---

## 2  Why Retrieval‑First Matters (Lessons from FlowSync)

| Pain in FlowSync                 | Mitigation                                           | Carry‑over for Reviewer AI                  |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| LLM calls on every chat = \$\$\$ | pgvector cache of embeddings + similarity cutoff     | Same: cache prior review comments & patches |
| Latency spikes at 4× traffic     | Edge Functions close to DB                           | Same: Supabase Edge Fn near vector store    |
| Hallucinated answers             | Retrieval context limited to top‑K relevant snippets | Same: top‑5 code context + diff chunks      |

---

## 3  AI Assistant Engine – Retrieval‑Augmented Pipeline

> **Core pattern:** *Retrieve → Rank → (Conditional) Generate → Store.*

### Conceptual Tables *(no schema provided)*

* `cr_messages` – raw reviewer + AI comments
* `cr_embeddings` – pgvector of each message
* `review_requests` – diff metadata & status

### Eight‑Step Flow (FlowSync‑to‑Reviewer Mapping)

1. **Insert New Prompt** – On PR/push, store developer comment/diff in `cr_messages`; embed text via `text-embedding-3-large` or self‑hosted model.
2. **K‑NN Search** – Query `cr_embeddings` with cosine similarity; fetch top‑5 prior replies relevant to this diff or file path.
3. **Cache Hit‡** – If similarity ≥ 0.85 AND tags match language → stream cached reply, Done.
4. **Cache Miss** – Build condensed prompt (5 snippets + diff hunk + dev note).
5. **LLM Call (OpenRouter)** – Route to GPT‑4o first; timeout 3 s; auto‑failover to Claude‑3.5.
6. **Store Reply** – Persist fresh comment to `cr_messages`; embed & upsert into `cr_embeddings`.
7. **Emit SSE** – Stream comment blocks back to IDE / GitHub Review UI in near‑real‑time.
8. **Post‑Merge Learning** – On PR merge, flag accepted AI suggestions; weight future retrieval ranking accordingly.

‡ *Cache Hit* = **free** (no token cost) & < 50 ms latency.

---

## 4  Embedding & Model Strategy

| Stage           | Default (Launch)                               | Phase‑2 (Scale)                         | Rationale                                              |
| --------------- | ---------------------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| **Embeddings**  | OpenAI `text-embedding-3-large` (\$0.00013/1K) | Self‑hosted `e5-mistral-7b` (GPU)       | Simpler go‑live → migrate when volume > 5 M tokens/day |
| **Completions** | GPT‑4o via OpenRouter                          | Fine‑tuned 13 B OSS on cached Q→A pairs | Gradual token costing downshift                        |

---

## 5  Cost‑Control & Licensing Playbook

1. **OpenRouter Tiering** – Free ≤ 50 calls/day; Pro ≥ 1 000.
2. **Concurrency Guardrail** – 10 inflight LLM calls/org; exponential back‑off on 429.
3. **Budget Alerts** – Helicone webhook triggers Slack when daily spend > \$20.
4. **Local Model Route** – Mistral‑7B in Docker (Apache‑2.0) for CI runs → \$0 variable cost.
5. **Audit Ledger** – Log (timestamp, user, diff hash, model, token count) for SOC‑2.

---

## 6  Edge Function Blueprint *(TypeScript / Deno)*

```ts
export const runtime = "edge";

export default async function handler(req: Request) {
  /* 0  Auth & rate‑limit */
  /* 1  Parse diff & prompt → embed */
  /* 2  K‑NN search top‑5 */
  /* 3  if (hit) return cached */
  /* 4  else call OpenRouter */
  /* 5  store reply + embedding */
  /* 6  stream SSE */
}
```

*Immutable and stateless beyond Deno request scope; all memory is in Supabase.*

---

## 7  Pricing Tiers (Updated with FlowSync Cost Insights)

| Plan | Seats | Review Comments | LLM Token Cap | OSS Model Option | Price       |
| ---- | ----- | --------------- | ------------- | ---------------- | ----------- |
| Free | 1     | 200 / mo        | 50 K          | —                | \$0         |
| Pro  | 5     | Unlimited       | 2 M           | Optional         | \$29 / seat |
| Team | 25    | Unlimited       | 10 M          | Included         | \$99 / seat |

> Overages: \$0.002 / 1 K tokens (pooled per org).

---

## 8  Security & Compliance Snapshot

* **RLS everywhere** (`org_id = auth.uid()`).
* **AES‑256‑GCM at rest** on diffs & comments.
* **SOC‑2 Type I** target Q4‑2025; Type II Q2‑2026.
* **Data Residency** – EU buckets for EU orgs.

---

## 9  Observability (FlowSync‑Grade)

| Metric          | Tool              | SLO                |
| --------------- | ----------------- | ------------------ |
| Edge cold‑start | Grafana Cloud     | P99 < 300 ms       |
| LLM spend       | Helicone          | Daily alert > \$20 |
| Cache hit‑ratio | Supabase Logflare | ≥ 70 %             |
| Error rate      | Sentry Edge       | < 0.1 %            |

---

## 10  Roadmap – Consolidated

| Phase                    | Milestone                                  | Outcome        |
| ------------------------ | ------------------------------------------ | -------------- |
| **Beta (Q3 2025)**       | FlowSync RAG transplanted; GPT‑4o primary  | Public beta    |
| **GA (Q4 2025)**         | OSS embeddings + cost dashboards           | 30 % cost drop |
| **Enterprise (Q1 2026)** | On‑prem vector cache, SAML, IP allow‑lists | SOC‑2 Type II  |

---
