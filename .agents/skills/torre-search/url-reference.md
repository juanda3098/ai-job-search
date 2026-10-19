# Torre.ai (`torre.ai`) URL & Endpoint Reference

## Base URL
- Web: `https://torre.ai`

## Endpoints

### 1. Subtorres (Curated Feeds)
- **Ingenieros de Software Remotos en Colombia**: `https://torre.ai/subtorre/ingenieros-software-remoto-colombia`
- **Trabajo Remoto en Colombia**: `https://torre.ai/subtorre/trabajo-remoto-colombia`

### 2. State Extraction Anchor
- In the page HTML, look for the Nuxt server-rendered payload:
  `window.__NUXT__=(function(...){ return { data: { "subtorre-...": { opportunities: [...] } } } })()`
- Opportunities array contains:
  - `id`: Opportunity identifier
  - `objective`: Job title
  - `slug`: URL slug
  - `organizations`: Array with `name`
  - `compensation`: Object with `currency`, `minAmount`, `maxAmount`, `periodicity`
  - `place`: Object with `remote`, `locationType`

### 3. Individual Posting URL
- Format: `https://torre.ai/post/{id}-{slug}`
