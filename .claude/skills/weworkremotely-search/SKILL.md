---
name: weworkremotely-search
version: 1.0.0
description: >
  Search 100% remote software engineering, frontend, full-stack, and backend developer
  jobs on We Work Remotely (weworkremotely.com) across Worldwide, LATAM, and Americas
  regions. Trigger phrases: weworkremotely, we work remotely, remote jobs WWR,
  trabajos remotos mundiales, remote developer jobs worldwide, WWR jobs.
context: fork
enabled: true
---

# We Work Remotely Search Skill

Search 100% remote job opportunities on **[We Work Remotely](https://weworkremotely.com)** (`weworkremotely.com`), the largest remote work community in the world with over 130,000 monthly users.

## Capabilities

- **Direct RSS Feeds**: Consumes official RSS 2.0 category feeds without needing browser emulation or encountering Cloudflare challenges.
- **Global & Regional Filtering**: Parses `<region>` tags to select jobs available `Anywhere in the World`, `LATAM / Latin America`, `Americas`, and `Colombia`, while filtering out region-locked jobs (e.g. `Only US`, `Canada Only`, `Europe Only`).
- **Rich Content**: Contains company name, job role, direct application link, category, publication date, and full HTML description.

## Data Feeds & Endpoints

### 1. Categories
- **Front-End Programming**: `https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss`
- **Full-Stack Programming**: `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss`
- **Back-End Programming**: `https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss`

### 2. RSS Item Structure
```xml
<item>
  <title>Company: Job Title</title>
  <region>Anywhere in the World</region>
  <country></country>
  <skills></skills>
  <category>Full-Stack Programming</category>
  <type>Full-Time</type>
  <pubDate>Sat, 17 Oct 2026 07:30:54 +0000</pubDate>
  <link>https://weworkremotely.com/remote-jobs/company-title</link>
  <description>...</description>
</item>
```

## Usage in `/scrape`

Integrated into `tools/fetch_portals.mjs`:

```bash
# Fetch We Work Remotely jobs matching React or Full Stack
node tools/fetch_portals.mjs --portal weworkremotely --query "full stack"

# Fetch all eligible remote global positions from the last 14 days
node tools/fetch_portals.mjs --portal weworkremotely --days 14
```

## Candidate Fit Criteria for Juan David

- **Region Verification**: Must be `Anywhere in the World`, `Worldwide`, `LATAM`, `Latin America`, or `Americas` eligible from Colombia. Strict veto on US-only or European work authorization mandates.
- **Language Gate**: We Work Remotely postings are predominantly in English. Review English requirements carefully; B1 working proficiency is acceptable, but flag or reject roles strictly requiring C1/C2 or native English.
- **Stack Alignment**: React, TypeScript, Node.js, NestJS.
