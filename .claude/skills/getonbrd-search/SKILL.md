---
name: getonbrd-search
version: 1.0.0
description: >
  Search job postings on Get on Board (getonbrd.com), the premier tech job board in
  Latin America, for software engineering, frontend, backend, full stack, Salesforce,
  and remote tech roles open to Colombia and LATAM. Trigger phrases: getonbrd,
  get on board, empleos getonbrd, trabajos getonbrd, remote tech LATAM, empleos Colombia,
  trabajos remotos Colombia tech.
context: fork
enabled: true
---

# Get on Board Search Skill

Search tech job postings on **[Get on Board](https://www.getonbrd.com)** (`getonbrd.com`), the leading technology job board in Latin America. It provides direct access to software engineering, web development, frontend (React), backend (Node.js/NestJS), full stack, and Salesforce roles open to Colombia and LATAM.

## Capabilities

- **Direct Public API Access**: Queries `https://www.getonbrd.com/api/v0/search/jobs?query={query}&per_page=20` without requiring API keys or authentication.
- **Remote Modality Filtering**: Native detection of `fully_remote`, `remote_local`, and country eligibility (Colombia / LATAM / Worldwide).
- **Company Metadata**: Company names and details retrieved via company ID (`/api/v0/companies/{id}`) and listing public URLs.
- **Salary Transparency**: Direct extraction of disclosed salary bounds (`min_salary`, `max_salary`, currency) and perks.
- **Language & Seniority**: Tags for junior, semi-senior, senior, and language requirements.

## API & Endpoints

### 1. Job Search
```http
GET https://www.getonbrd.com/api/v0/search/jobs?query={query}&per_page=20
```

Returns a JSON collection with:
- `id`: Job slug identifier (e.g. `technical-lead-senior-bci-santiago-3e19`)
- `attributes.title`: Job title
- `attributes.remote`: Boolean flag
- `attributes.remote_modality`: `'fully_remote' | 'remote_local' | 'hybrid' | 'no_remote'`
- `attributes.countries`: Array of country names or `['Remote']`
- `attributes.published_at`: Epoch timestamp (seconds)
- `attributes.min_salary` / `attributes.max_salary`: Numerical compensation if disclosed
- `attributes.description`: HTML-formatted job requirements and description
- `links.public_url`: Full web posting URL

### 2. Company Lookup
```http
GET https://www.getonbrd.com/api/v0/companies/{company_id}
```
Returns company name, description, website, country, and logo.

## Usage in `/scrape`

This skill is integrated into the automated scraper workflow via `tools/fetch_portals.mjs`:

```bash
# Run standalone search for React jobs on Get on Board
node tools/fetch_portals.mjs --portal getonbrd --query "react"

# Run full stack search with recency of 14 days
node tools/fetch_portals.mjs --portal getonbrd --query "full stack" --days 14
```

## Candidate Fit Criteria for Juan David

- **Remote Only**: Filter for `remote: true` or `countries` containing `Colombia` or `Remote`. Discard mandatory onsite/hybrid in other cities/countries (Santiago, Buenos Aires, CDMX, Lima, Bogotá).
- **Language Gate**: Flag postings that demand fluent or bilingual C1/C2 English. Highlight Spanish-first and B1-compatible roles.
- **Tech Stack**: Prioritize React, TypeScript, Node.js, NestJS, and Salesforce (Apex, LWC). Veto Mobile (Flutter, React Native, iOS, Android).
