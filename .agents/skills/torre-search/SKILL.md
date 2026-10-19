---
name: torre-search
version: 1.0.0
description: >
  Search remote software engineering, web development, frontend (React), backend, full stack,
  and tech jobs in Colombia and Latin America on Torre.ai (torre.ai). Trigger phrases:
  torre, torre.ai, empleos torre, trabajos torre, torre tech jobs, empleos remotos Colombia torre.
context: fork
enabled: true
---

# Torre.ai Search Skill

Search tech and software engineering jobs on **[Torre.ai](https://torre.ai)** (`torre.ai`), the leading Latin American talent and recruitment platform founded by Alexander Torrenegra. Torre specializes in 100% remote software engineering, web development, and digital product opportunities open to Colombian and LATAM talent.

## Capabilities

- **Direct Subtorre SSR Extraction**: Extracts live job postings from Torre's curated remote channels (`trabajo-remoto-colombia`, `ingenieros-software-remoto-colombia`) via server-rendered Nuxt state.
- **Transparent Compensation**: Captures disclosed compensation ranges (`minAmount`, `maxAmount`, `currency`, `periodicity`).
- **Company & Opportunity Metadata**: Extracts company name, verified job title, remote modality, and direct posting URLs (`https://torre.ai/post/{id}-{slug}`).
- **Colombia & LATAM Focus**: Native focus on remote jobs available to professionals residing in Colombia.

## Data Endpoints

### 1. Curated Subtorre Channels
- `GET https://torre.ai/subtorre/ingenieros-software-remoto-colombia`
- `GET https://torre.ai/subtorre/trabajo-remoto-colombia`

### 2. Posting URL Pattern
```
https://torre.ai/post/{opportunity_id}-{slug}
```

### 3. Data Schema
```json
{
  "id": "qdPD9Kbd",
  "objective": "Mid Product & Project Manager",
  "slug": "sweatworks-mid-product-project-manager",
  "organizations": [
    { "name": "SweatWorks" }
  ],
  "compensation": {
    "currency": "USD",
    "minAmount": 2500,
    "maxAmount": 3500,
    "periodicity": "monthly"
  },
  "place": {
    "remote": true
  }
}
```

## Usage in `/scrape`

Integrated into `tools/fetch_portals.mjs`:

```bash
# Standalone search on Torre.ai
node tools/fetch_portals.mjs --portal torre --query "software engineer" --format table

# Full multi-portal search including Torre.ai
node tools/fetch_portals.mjs --portal all --format table
```

## Candidate Fit Criteria for Juan David

- **Remote Only**: Filter for `place.remote === true` or location explicitly including Colombia / Remote.
- **Language Gate**: Torre listings indicate required languages (Spanish / English). Highlight Spanish-first and B1-compatible roles. Flag roles demanding strict C1/C2 English.
- **Tech Stack**: React, TypeScript, Node.js, NestJS, Salesforce, Full Stack.
