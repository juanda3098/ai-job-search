# We Work Remotely (`weworkremotely.com`) URL & Feed Reference

## Base URL
- Web: `https://weworkremotely.com`

## RSS Feed Endpoints (Preferred - Cloudflare Free)
- **Front-End Programming**: `https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss`
- **Full-Stack Programming**: `https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss`
- **Back-End Programming**: `https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss`
- **DevOps / Sysadmin**: `https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss`

## HTML Search (Protected by Cloudflare)
- **Search URL**: `https://weworkremotely.com/remote-jobs/search?term={query}`
- Note: This endpoint serves Cloudflare Turnstile / anti-bot challenges to automated requests. RSS feeds should always be preferred as they update in real time and are publicly unblocked.

## Region Parsing Guide
- **Eligible for Colombia**:
  - `Anywhere in the World`
  - `Worldwide`
  - `LATAM`
  - `Latin America`
  - `Americas`
  - `Remote - Americas`
  - `Colombia`
- **Ineligible (Veto)**:
  - `USA Only`, `Only US`, `US / Canada Only`
  - `Europe Only`, `UK Only`, `EMEA`
  - `APAC Only`
