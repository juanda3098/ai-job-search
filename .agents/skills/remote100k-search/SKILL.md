---
name: remote100k-search
version: 1.0.0
description: >
  Search high-compensation ($100k+ USD) remote software engineering, full stack,
  frontend, and tech jobs on Remote100k (remote100k.com). Focuses on verified
  high-salary remote engineering roles open to global, Americas, and Colombia contractors.
  Trigger phrases: remote100k, remote 100k, remote100k.com, high salary remote jobs,
  trabajos remotos 100k, tech jobs 100k usd.
context: fork
enabled: true
---

# Remote100k Search Skill

Search high-compensation ($100k+ USD/year) remote software engineering jobs on **[Remote100k](https://remote100k.com)** (`remote100k.com`), a curated job board dedicated exclusively to six-figure remote opportunities across top tech companies and startups.

## Capabilities

- **Curated High Salaries**: All job postings disclose compensation, guaranteed at $100,000 USD to $350,000+ USD per year.
- **Server-Side Rendered Listings**: Direct extraction from `https://remote100k.com/remote-jobs/engineering`.
- **Structured Card Fields**: Extracts job title, company name, salary bounds, age in days (`data-days`), and remote location restrictions.
- **Contractor / Global Focus**: Filters for global `Remote` and Americas-eligible roles for candidates based in Colombia.

## Data Endpoints

### 1. Engineering Category
- **URL**: `GET https://remote100k.com/remote-jobs/engineering`
- **Markup Structure**:
  - Listing container: `<a href="/remote-job/{slug}" data-days="{n}" class="... job-card ...">`
  - Title: `<h3 class="job-card-desktop-title ...">`
  - Company: `<p class="job-card-desktop-company ...">`
  - Salary: `<div class="job-card-salary">`
  - Location: `<i class="bi bi-geo-alt"></i> Remote: ...`

## Usage in `/scrape`

Integrated into `tools/fetch_portals.mjs`:

```bash
# Standalone search on Remote100k
node tools/fetch_portals.mjs --portal remote100k --query "software engineer" --format table

# Full multi-portal search
node tools/fetch_portals.mjs --portal all --format table
```

## Candidate Fit Criteria for Juan David

- **Geographic Gate**: Focus on positions marked `Remote` (without US/Canada exclusivity) or international contractor positions. Discard roles requiring mandatory US or Canadian residency/work authorization.
- **Language Gate**: Listings are in English. Review English requirements; flag or veto roles requiring native or near-native C1/C2 fluency.
- **Stack Alignment**: React, TypeScript, Node.js, NestJS, Full Stack, Software Engineering.
