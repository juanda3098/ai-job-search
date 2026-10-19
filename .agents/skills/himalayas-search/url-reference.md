# Himalayas (`himalayas.app`) URL & Endpoint Reference

## Base URL
- Web: `https://himalayas.app`
- API: `https://himalayas.app/jobs/api`

## Public Feed Endpoint
- **URL**: `GET https://himalayas.app/jobs/api`
- **Query Parameters**:
  - `limit`: Number of jobs per request (1-50, default 20)
  - `cursor`: Token string for cursor pagination (`nextCursor`)
- **Headers**:
  - `User-Agent: Mozilla/5.0 (compatible; ai-job-search/1.0)`
- **Response Format**: JSON
  - `totalCount`: Total number of active postings in the database
  - `nextCursor`: String token for fetching the next page
  - `jobs`: Array of job objects

## Location Handling Guide
- `locationRestrictions`: Array of country names.
  - `[]` (empty array) = Open worldwide to anyone with no geographic restrictions.
  - `['Colombia']` or contains `'Latin America'` / `'Worldwide'` / `'Americas'` = Eligible for remote work from Colombia.
  - `['United States']`, `['Canada']`, `['United Kingdom']`, etc. = Region-locked (veto unless international contractors explicitly mentioned in description).
