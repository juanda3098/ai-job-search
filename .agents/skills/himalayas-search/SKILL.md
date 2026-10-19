---
name: himalayas-search
version: 1.0.0
description: >
  Search remote software engineering, web development, frontend, backend, full stack,
  and Salesforce jobs on Himalayas (himalayas.app) via its official public JSON API.
  Finds remote jobs with transparent salary ranges, timezone filters, and country
  restrictions (worldwide, LATAM, and Colombia eligible). Trigger phrases: himalayas,
  himalayas.app, himalayas jobs, remote jobs himalayas, remote tech jobs worldwide.
context: fork
enabled: true
---

# Himalayas Search Skill

Search remote software engineering and tech jobs on **[Himalayas](https://himalayas.app)** (`himalayas.app`), an authoritative remote job board featuring comprehensive company profiles, verified salaries, and explicit location/timezone restrictions.

## Capabilities

- **Official Public JSON API**: Queries `https://himalayas.app/jobs/api` directly with zero authentication and structured JSON responses.
- **Location & Timezone Transparency**: Parses `locationRestrictions` (e.g. `[]` for unrestricted worldwide, `Colombia`, `Latin America`) and `timezoneRestrictions` (UTC offsets).
- **Salary Data**: Provides disclosed salary ranges (`minSalary`, `maxSalary`, `currency`, `salaryPeriod`).
- **Company & Job URLs**: Direct application links (`applicationLink`) and direct profile URLs (`https://himalayas.app/companies/{companySlug}/jobs/{slug}`).

## Endpoints

### 1. Job Feed API
```http
GET https://himalayas.app/jobs/api?limit=50
```
Parameters:
- `limit`: Number of jobs per page (max 50).
- `cursor`: Cursor string for pagination from `nextCursor`.

### 2. JSON Schema
```json
{
  "totalCount": 125000,
  "nextCursor": "...",
  "jobs": [
    {
      "title": "Principal Software Engineer",
      "companyName": "Apollo",
      "companySlug": "apollo",
      "minSalary": 180000,
      "maxSalary": 240000,
      "currency": "USD",
      "locationRestrictions": [],
      "timezoneRestrictions": [-5, -6, -7, -8],
      "categories": ["Engineering", "React", "TypeScript"],
      "applicationLink": "https://himalayas.app/companies/...",
      "pubDate": 1792251583,
      "description": "..."
    }
  ]
}
```

## Usage in `/scrape`

Integrated into `tools/fetch_portals.mjs`:

```bash
# Standalone search on Himalayas
node tools/fetch_portals.mjs --portal himalayas --query "react" --format table

# Search all active portals including Himalayas
node tools/fetch_portals.mjs --portal all --format table
```

## Candidate Fit Criteria for Juan David

- **Location Gate**: Include jobs where `locationRestrictions` is empty `[]` (unrestricted global), or includes `Colombia`, `Latin America`, or `Worldwide`. Exclude jobs strictly restricted to `United States`, `Canada`, `UK`, or `Europe`.
- **Language Gate**: Himalayas postings are mostly in English. Review English requirements; allow B1 conversational proficiency, flag or reject strict C1/C2 or native-only mandates.
- **Stack Alignment**: React, TypeScript, Node.js, NestJS, Salesforce.
