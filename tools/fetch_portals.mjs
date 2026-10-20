#!/usr/bin/env node
/**
 * fetch_portals.mjs
 * Multi-portal fetcher for Get on Board, We Work Remotely, and FreeHire.
 * Zero external dependencies — uses Node.js 20 native fetch.
 * 
 * Usage:
 *   node tools/fetch_portals.mjs --portal getonbrd --query "react"
 *   node tools/fetch_portals.mjs --portal weworkremotely --query "full stack"
 *   node tools/fetch_portals.mjs --portal all --query "react" --days 14 --format table
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateScrapeMarkdown } from './generate_scrape_md.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Helper to decode HTML entities
function decodeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {
    portal: 'all',
    query: '',
    days: 30,
    limit: 20,
    format: 'json',
    output: null,
    filterProfile: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--portal' || arg === '-p') {
      flags.portal = args[++i];
    } else if (arg === '--query' || arg === '-q') {
      flags.query = args[++i];
    } else if (arg === '--days' || arg === '-d') {
      flags.days = parseInt(args[++i], 10) || 30;
    } else if (arg === '--limit' || arg === '-l') {
      flags.limit = parseInt(args[++i], 10) || 20;
    } else if (arg === '--format' || arg === '-f') {
      flags.format = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      flags.output = args[++i];
    } else if (arg === '--no-filter') {
      flags.filterProfile = false;
    }
  }

  return flags;
}

// Load seen_jobs and job_search_tracker for dedup
function loadState() {
  const seenUrls = new Set();
  const seenCompanyRoles = new Set();

  try {
    const seenJobsPath = path.join(ROOT, 'job_scraper', 'seen_jobs.json');
    if (fs.existsSync(seenJobsPath)) {
      const data = JSON.parse(fs.readFileSync(seenJobsPath, 'utf8'));
      if (data && data.seen) {
        for (const [key, job] of Object.entries(data.seen)) {
          if (job.url) seenUrls.add(job.url.toLowerCase());
          if (job.company && job.title) {
            seenCompanyRoles.add(`${job.company.toLowerCase()}|${job.title.toLowerCase()}`);
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    const trackerPath = path.join(ROOT, 'job_search_tracker.csv');
    if (fs.existsSync(trackerPath)) {
      const lines = fs.readFileSync(trackerPath, 'utf8').split('\n');
      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;
        const cols = line.split(',');
        const company = cols[1]?.trim().toLowerCase();
        const role = cols[3]?.trim().toLowerCase();
        const url = cols[12]?.trim().toLowerCase();
        if (url) seenUrls.add(url);
        if (company && role) seenCompanyRoles.add(`${company}|${role}`);
      }
    }
  } catch (e) {
    // ignore
  }

  return { seenUrls, seenCompanyRoles };
}

// Check if job matches Juan David's language gate
function evaluateLanguage(text = '', company = '') {
  const comp = (company || '').toLowerCase();
  // Staffing and nearshore agencies that strictly demand Advanced / Fluent / C1 English for US client placements
  const strictlyAdvancedEnglishAgencies = [
    'bairesdev',
    'indi staffing',
    'epam',
    'truelogic',
    'lemon.io',
    'newtonx',
    'leanware',
    'huge',
    'hugeinc',
    'atlas bench',
    'ruzora',
    'niuro'
  ];
  if (strictlyAdvancedEnglishAgencies.some(a => comp.includes(a))) {
    return { gate: 'FLAG', note: 'Requiere inglés avanzado / C1 / clientes directos EE.UU.' };
  }

  if (!text) return { gate: 'PASS', note: null };
  const lower = text.toLowerCase();
  
  if (/c1|c2|fluent|fluency|\badvanced\b[^.]*english|english[^.]*\badvanced\b|professional english|professional working proficiency|full professional proficiency|proficient\s*(in\s*)?english|strong\s*[^.]*english|excellent\s*[^.]*english|bilingual english|ingl[eé]s avanzado|ingl[eé]s fluido|english proficiency|english advanced/i.test(lower)) {
    return { gate: 'FLAG', note: 'Requiere inglés avanzado / profesional / C1 / fluido / excelente' };
  }
  if (/b2\+?|intermediate-advanced english|upper-intermediate|ingl[eé]s intermedio-alto/i.test(lower)) {
    return { gate: 'FLAG', note: 'Requiere inglés intermedio-alto (B2)' };
  }
  if (/b1|conversational english|working english|ingl[eé]s conversacional|ingl[eé]s intermedio/i.test(lower)) {
    return { gate: 'PASS', note: 'Inglés conversacional / B1 compatible' };
  }
  return { gate: 'PASS', note: 'Español prioritario o sin requerimiento estricto de inglés' };
}

// Check quick fit level strictly aligned with Juan David's profile
function evaluateFit(title, description, location = '', company = '') {
  const text = `${title} ${description}`.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const loc = (location || '').toLowerCase();
  const comp = (company || '').toLowerCase();

  // 1. Non-developer / Non-engineering veto
  if (/\b(administrator|salesforce admin|administrador|marketing|sales|recruiter|talent acquisition|account executive|care coach|content writer|customer success|growth manager|b2b outreach|operations coordinator|inside sales|sdm|director|head of technology|manager|business analyst|qa|sdet|scrum master|consultor salesforce md)\b/i.test(lowerTitle) &&
      !/\b(developer|desarrollador|engineer|programmer|tech lead|architect)\b/i.test(lowerTitle)) {
    return 'low';
  }

  // Exclude malformed ADP / hash company names
  if (/^[a-f0-9]{8}-[a-f0-9]{4}/i.test(company || '')) {
    return 'low';
  }

  // 2. Strict Location Gate Veto: Candidate resides in Colombia.
  if (/\b(usa only|us only|only us|only usa|must reside in the us|united states only|canada only|uk only|europe only|india only|philippines only|must be located in the us|us citizen|green card required|security clearance|public trust|federal|us - remote eligible|must live in a state where airbnb)\b/i.test(text + ' ' + loc)) {
    return 'low';
  }
  if (comp.includes('elyon') || comp.includes('housequant') || (comp.includes('airbnb') && !/(colombia|latam)/i.test(loc))) {
    return 'low';
  }
  if (/\b(united states|remote,\s*us|remote\s*-\s*usa|virginia|delhi|bangalore|pune|hyderabad|manila|pakistan|romania|boston|massachusetts|czech republic|spain|brazil|canada)\b/i.test(loc) &&
      !/\b(colombia|latam|latin america|worldwide|global|anywhere)\b/i.test(loc)) {
    return 'low';
  }

  // 3. Strict Anti-Stack Veto (Technologies outside Juan David's profile)
  const titleHasAntiStack = /\b(\.net|c#|dotnet|csharp|angular|angularjs|golang|\bgo\b|python|django|fastapi|java\b|spring boot|springboot|php|laravel|ruby|rails|sage x3|sap|flutter|swift|kotlin|react native|mobile developer|ios|android)\b/i.test(lowerTitle);
  if (titleHasAntiStack) {
    return 'low';
  }

  // Strong anti-stack requirements in description
  const requiresAngular = /\b(angular\s*(2\+|\d+|developer|expert)|experiencia en angular|requerido:?\s*angular|dominio de angular)\b/i.test(text);
  const requiresDotNet = /\b(\.net\s*core|c#\s*developer|asp\.net|experiencia en \.net)\b/i.test(text);
  const requiresSage = /\b(sage\s*x3)\b/i.test(text);
  const requiresGoOrPythonBackend = /\b(go\s*or\s*python|golang\s*developer|senior\s*python\s*developer|strong go experience)\b/i.test(text) && !/\b(react|typescript)\b/i.test(lowerTitle);
  const requiresMobile = /\b(flutter|react native|ios developer|android developer|swift|kotlin mobile)\b/i.test(text) && !/\b(react\.js|full.?stack|frontend|salesforce)\b/i.test(lowerTitle);
  const requiresRuby = /\b(ruby\s*on\s*rails|rails\s*developer|experiencia en ruby|key skills:\s*ruby)\b/i.test(text);

  if (requiresAngular || requiresDotNet || requiresSage || requiresGoOrPythonBackend || requiresMobile || requiresRuby) {
    return 'low';
  }

  // 4. Strict Language Gate Veto
  const lang = evaluateLanguage(text, company);
  if (lang.gate === 'FLAG') {
    return 'low';
  }

  // 5. Positive High Match
  // A. Salesforce Roles
  if (/\b(salesforce|apex|lwc|lightning web components)\b/i.test(text) &&
      /\b(developer|desarrollador|engineer|consultor t[eé]cnico|technical consultant)\b/i.test(lowerTitle) &&
      !/\b(admin|administrator|administrador|functional)\b/i.test(lowerTitle)) {
    return 'high';
  }

  // B. React / Next.js primary roles
  if (/\b(react(\.js|js)?|next\.js)\b/i.test(lowerTitle) && !titleHasAntiStack) {
    return 'high';
  }

  // C. Full-Stack / Frontend with explicit React / Node / TypeScript / NestJS
  if (/\b(full.?stack|desarrollador full stack|software engineer|ingeniero de software|frontend|front-end|product engineer)\b/i.test(lowerTitle) &&
      /\b(react(\.js|js)?|next\.js)\b/i.test(text) && /\b(node|typescript|nest\.?js|javascript)\b/i.test(text) && !titleHasAntiStack) {
    return 'high';
  }

  // 6. Medium Match
  // Adjacent roles with compatible stack (Node, TypeScript, NestJS, general frontend in React)
  if (/\b(node\.js|nestjs|typescript|frontend|front-end|full.?stack|software engineer|desarrollador)\b/i.test(lowerTitle) &&
      /\b(javascript|typescript|react|node|nestjs|web)\b/i.test(text) && !titleHasAntiStack) {
    return 'medium';
  }

  return 'low';
}

// Fetch GetOnBrd jobs
async function fetchGetOnBrd(query, days, limit, state) {
  const results = [];
  const companyCache = new Map();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

  const searchUrl = `https://www.getonbrd.com/api/v0/search/jobs?query=${encodeURIComponent(query)}&per_page=${Math.min(limit, 25)}`;
  
  try {
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
    });
    if (!res.ok) {
      console.error(`[getonbrd] Search request failed with status: ${res.status}`);
      return results;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.data)) return results;

    for (const item of data.data) {
      const attr = item.attributes || {};
      const links = item.links || {};
      const url = links.public_url || `https://www.getonbrd.com/jobs/${item.id}`;

      // Check recency
      const publishedMs = (attr.published_at || 0) * 1000;
      if (publishedMs && publishedMs < cutoff) continue;

      // Remote eligibility check
      const isRemote = attr.remote === true || 
                       attr.remote_modality === 'fully_remote' || 
                       attr.remote_modality === 'remote_world';

      // In Get on Board, remote_local restricts to the employer's local countries.
      // Verify Colombia is explicitly supported for remote_local positions:
      if (attr.remote_modality === 'remote_local') {
        const isColombiaAllowed = (attr.country_boost === 'CO') ||
                                  (Array.isArray(attr.countries) && attr.countries.some(c => /colombia/i.test(c))) ||
                                  (attr.description && /colombia/i.test(attr.description));
        if (!isColombiaAllowed) continue;
      }

      const countries = Array.isArray(attr.countries) ? attr.countries : [];
      const eligibleRegion = countries.some(c => /remote|colombia|latam|latin america|worldwide/i.test(c));

      // Must be remote or Colombia eligible
      if (!isRemote && !eligibleRegion) continue;

      // Get Company Name
      let company = 'Get on Board Employer';
      const companyId = attr.company?.data?.id;
      if (companyId) {
        if (companyCache.has(companyId)) {
          company = companyCache.get(companyId);
        } else {
          try {
            const compRes = await fetch(`https://www.getonbrd.com/api/v0/companies/${companyId}`, {
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
            });
            if (compRes.ok) {
              const compJson = await compRes.json();
              if (compJson?.data?.attributes?.name) {
                company = compJson.data.attributes.name;
                companyCache.set(companyId, company);
              }
            }
          } catch (e) {
            // fallback to slug
          }
        }
      }

      // Check dedup
      if (state.seenUrls.has(url.toLowerCase())) continue;
      if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${(attr.title || '').toLowerCase()}`)) continue;

      const dateStr = publishedMs ? new Date(publishedMs).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const cleanDesc = decodeHTML(attr.description || '');
      const langCheck = evaluateLanguage(cleanDesc, company);
      const fit = evaluateFit(attr.title || '', cleanDesc, attr.country_boost || attr.country || 'Colombia/LATAM', company);

      let salary = null;
      if (attr.min_salary || attr.max_salary) {
        salary = `${attr.min_salary || ''} - ${attr.max_salary || ''} USD`.trim();
      }

      results.push({
        id: item.id,
        title: attr.title || 'Untitled',
        company,
        location: isRemote ? '100% Remoto (Colombia/LATAM)' : (countries.join(', ') || 'Remoto'),
        date: dateStr,
        deadline: null,
        url,
        portal: 'getonbrd-search',
        source: 'api',
        fit,
        salary,
        language_gate: langCheck.gate,
        language_note: langCheck.note,
        description: cleanDesc.slice(0, 300) + '...'
      });
    }
  } catch (err) {
    console.error(`[getonbrd] Error fetching: ${err.message}`);
  }

  return results;
}

// Fetch WeWorkRemotely jobs
async function fetchWeWorkRemotely(query, days, limit, state) {
  const results = [];
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

  const feeds = [
    'https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss'
  ];

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const items = xml.split('<item>').slice(1);

      for (const itemXml of items) {
        if (results.length >= limit) break;

        const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || itemXml.match(/<title>(.*?)<\/title>/);
        const linkMatch = itemXml.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/) || itemXml.match(/<link>(.*?)<\/link>/);
        const regionMatch = itemXml.match(/<region>(.*?)<\/region>/);
        const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
        const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || itemXml.match(/<description>([\s\S]*?)<\/description>/);

        const rawTitle = titleMatch ? titleMatch[1] : '';
        const link = linkMatch ? linkMatch[1] : '';
        const region = regionMatch ? regionMatch[1] : '';
        const pubDateStr = pubDateMatch ? pubDateMatch[1] : '';
        const rawDesc = descMatch ? descMatch[1] : '';

        // Check date
        const pubDateMs = Date.parse(pubDateStr);
        if (pubDateMs && pubDateMs < cutoff) continue;

        // Check region: Must be Worldwide, LATAM, Americas, Colombia
        const isEligibleRegion = /world|anywhere|latam|latin america|americas|colombia/i.test(region) &&
                                 !/usa only|only us|us only|canada only|europe only|uk only/i.test(region);
        if (!isEligibleRegion) continue;

        // Split Company and Title
        const parts = rawTitle.split(':');
        const company = parts.length > 1 ? parts[0].trim() : 'WeWorkRemotely Employer';
        const title = parts.length > 1 ? parts.slice(1).join(':').trim() : rawTitle;

        // Query keyword filter
        const cleanDesc = decodeHTML(rawDesc);
        const fullContent = `${title} ${company} ${cleanDesc}`.toLowerCase();
        if (query) {
          const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
          const matches = qWords.some(w => fullContent.includes(w));
          if (!matches) continue;
        }

        // Check dedup
        if (state.seenUrls.has(link.toLowerCase())) continue;
        if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${title.toLowerCase()}`)) continue;

        const dateStr = pubDateMs ? new Date(pubDateMs).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const langCheck = evaluateLanguage(cleanDesc, company);
        const fit = evaluateFit(title, cleanDesc, region, company);

        results.push({
          id: link.split('/').pop() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title,
          company,
          location: `100% Remoto (${region})`,
          date: dateStr,
          deadline: null,
          url: link,
          portal: 'weworkremotely-search',
          source: 'rss',
          fit,
          salary: null,
          language_gate: langCheck.gate,
          language_note: langCheck.note,
          description: cleanDesc.slice(0, 300) + '...'
        });
      }
    } catch (e) {
      console.error(`[weworkremotely] Error reading feed: ${e.message}`);
    }
  }

  return results;
}

// Fetch Himalayas jobs
async function fetchHimalayas(query, days, limit, state) {
  const results = [];
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

  try {
    const res = await fetch(`https://himalayas.app/jobs/api?limit=50`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
    });
    if (!res.ok) {
      console.error(`[himalayas] API error: ${res.status}`);
      return results;
    }
    const data = await res.json();
    if (!data || !Array.isArray(data.jobs)) return results;

    for (const j of data.jobs) {
      if (results.length >= limit) break;

      // Check date
      const pubMs = (j.pubDate || 0) * 1000;
      if (pubMs && pubMs < cutoff) continue;

      // Check location restrictions
      const locs = Array.isArray(j.locationRestrictions) ? j.locationRestrictions : [];
      // Empty array = open worldwide without geographic restrictions
      const isWorldwide = locs.length === 0;
      const isEligible = isWorldwide || locs.some(loc => /colombia|latin america|americas|worldwide|anywhere/i.test(loc));
      const isBlocked = locs.length > 0 && locs.every(loc => /united states|usa|canada|united kingdom|uk|germany|france|australia|india|philippines/i.test(loc));

      if (isBlocked && !isEligible) continue;

      const title = j.title || 'Untitled';
      const company = j.companyName || 'Himalayas Employer';
      const url = j.applicationLink || j.guid || `https://himalayas.app/companies/${j.companySlug}/jobs`;

      // Check query match
      const cleanDesc = decodeHTML(j.description || j.excerpt || '');
      const categories = Array.isArray(j.categories) ? j.categories.join(' ') : '';
      const textToSearch = `${title} ${categories} ${cleanDesc}`.toLowerCase();

      if (query) {
        const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = qWords.some(w => textToSearch.includes(w));
        if (!matches) continue;
      }

      // Check dedup
      if (state.seenUrls.has(url.toLowerCase())) continue;
      if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${title.toLowerCase()}`)) continue;

      const dateStr = pubMs ? new Date(pubMs).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const langCheck = evaluateLanguage(cleanDesc, company);
      const fit = evaluateFit(title, cleanDesc, j.location || 'Worldwide', company);

      let salary = null;
      if (j.minSalary || j.maxSalary) {
        salary = `${j.minSalary || ''} - ${j.maxSalary || ''} ${j.currency || 'USD'}`.trim();
      }

      const locationStr = isWorldwide ? '100% Remoto (Worldwide)' : `100% Remoto (${locs.join(', ')})`;

      results.push({
        id: j.guid?.split('/').pop() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        title,
        company,
        location: locationStr,
        date: dateStr,
        deadline: j.expiryDate ? new Date(j.expiryDate * 1000).toISOString().slice(0, 10) : null,
        url,
        portal: 'himalayas-search',
        source: 'api',
        fit,
        salary,
        language_gate: langCheck.gate,
        language_note: langCheck.note,
        description: cleanDesc.slice(0, 300) + '...'
      });
    }
  } catch (err) {
    console.error(`[himalayas] Error: ${err.message}`);
  }

  return results;
}

// Fetch Remote100k jobs
async function fetchRemote100k(query, days, limit, state) {
  const results = [];

  try {
    const res = await fetch('https://remote100k.com/remote-jobs/engineering', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
    });
    if (!res.ok) {
      console.error(`[remote100k] HTTP error: ${res.status}`);
      return results;
    }
    const html = await res.text();
    const parts = html.split('<a href="/remote-job/');

    for (let i = 1; i < parts.length; i++) {
      if (results.length >= limit) break;

      const chunk = parts[i];
      const urlPath = chunk.match(/^([^"\s]+)/)?.[1];
      if (!urlPath) continue;

      const daysMatch = chunk.match(/data-days="([^"]+)"/);
      const titleMatch = chunk.match(/class="job-card-desktop-title[^>]*>([\s\S]*?)<\/h3>/);
      const companyMatch = chunk.match(/class="job-card-desktop-company[^>]*>([\s\S]*?)<\/p>/);
      const salaryMatch = chunk.match(/class="job-card-salary"[^>]*>([\s\S]*?)<\/div>/);
      const locationMatch = chunk.match(/<i class="bi bi-geo-alt"><\/i>([\s\S]*?)<\/span>/);

      const jobDays = daysMatch ? parseInt(daysMatch[1], 10) : 0;
      if (jobDays > days) continue;

      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const company = companyMatch ? companyMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      const rawLocation = locationMatch ? locationMatch[1].replace(/<[^>]+>/g, '').trim() : 'Remote';
      const salary = salaryMatch ? salaryMatch[1].replace(/<[^>]+>/g, '').trim() : null;

      // Filter location: Must be global Remote or Americas/Colombia
      const isGlobalRemote = rawLocation === 'Remote' || /worldwide|global|anywhere|latam|latin america|colombia/i.test(rawLocation);
      const isExclusiveUSACanada = /(usa|canada|uk|germany)/i.test(rawLocation) && !isGlobalRemote;

      if (isExclusiveUSACanada) continue;

      const url = `https://remote100k.com/remote-job/${urlPath}`;

      if (query) {
        const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
        const matches = qWords.some(w => `${title} ${company}`.toLowerCase().includes(w));
        if (!matches) continue;
      }

      // Check dedup
      if (state.seenUrls.has(url.toLowerCase())) continue;
      if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${title.toLowerCase()}`)) continue;

      const pubDateMs = Date.now() - (jobDays * 24 * 60 * 60 * 1000);
      const dateStr = new Date(pubDateMs).toISOString().slice(0, 10);
      const fit = evaluateFit(title, title);

      results.push({
        id: urlPath,
        title,
        company,
        location: `100% Remoto (${rawLocation})`,
        date: dateStr,
        deadline: null,
        url,
        portal: 'remote100k-search',
        source: 'html',
        fit,
        salary,
        language_gate: 'FLAG',
        language_note: 'Portal internacional en inglés ($100k+ USD)',
        description: `Posición verificada $100k+ USD en Remote100k: ${title} en ${company}.`
      });
    }
  } catch (err) {
    console.error(`[remote100k] Error: ${err.message}`);
  }

  return results;
}

// Fetch Torre.ai jobs
async function fetchTorre(query, days, limit, state) {
  const results = [];
  const subtorres = [
    'ingenieros-software-remoto-colombia',
    'trabajo-remoto-colombia'
  ];

  for (const sub of subtorres) {
    try {
      const res = await fetch(`https://torre.ai/subtorre/${sub}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-job-search/1.0)' }
      });
      if (!res.ok) continue;

      const text = await res.text();
      const start = text.indexOf('window.__NUXT__=');
      if (start === -1) continue;

      const end = text.indexOf('</script>', start);
      const code = text.slice(start + 'window.__NUXT__='.length, end).trim();
      const fn = new Function(`return ${code}`);
      const data = fn();
      const subKey = Object.keys(data?.data || {})[0];
      const opps = data?.data?.[subKey]?.opportunities || [];

      for (const o of opps) {
        if (results.length >= limit) break;

        const title = o.objective || 'Untitled';
        const company = o.organizations?.[0]?.name || 'Torre Employer';
        const url = `https://torre.ai/post/${o.id}-${o.slug}`;
        const tagline = o.tagline || '';

        // Check query match if provided
        if (query) {
          const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
          const content = `${title} ${company} ${tagline}`.toLowerCase();
          const matches = qWords.some(w => content.includes(w));
          if (!matches) continue;
        }

        // Check dedup
        if (state.seenUrls.has(url.toLowerCase())) continue;
        if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${title.toLowerCase()}`)) continue;

        let salary = null;
        if (o.compensation && (o.compensation.minAmount || o.compensation.maxAmount)) {
          salary = `${o.compensation.minAmount || ''} - ${o.compensation.maxAmount || ''} ${o.compensation.currency || 'USD'} / ${o.compensation.periodicity || 'monthly'}`.trim();
        }

        const dateStr = new Date().toISOString().slice(0, 10);
        const fit = evaluateFit(title, tagline, 'Colombia/LATAM', company);
        const langCheck = evaluateLanguage(tagline, company);

        results.push({
          id: o.id,
          title,
          company,
          location: '100% Remoto (Colombia/LATAM)',
          date: dateStr,
          deadline: null,
          url,
          portal: 'torre-search',
          source: 'html',
          fit,
          salary,
          language_gate: langCheck.gate,
          language_note: langCheck.note,
          description: tagline ? `${tagline.slice(0, 300)}...` : `Vacante en Torre.ai: ${title} en ${company}.`
        });
      }
    } catch (e) {
      console.error(`[torre] Error: ${e.message}`);
    }
  }

  return results;
}

// Extract inner HTML of div by class name
function extractDivContent(html, className) {
  const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const openRe = new RegExp(`<div[^>]*class="[^"]*${escaped}[^"]*"[^>]*>`, 'i');
  const open = openRe.exec(html);
  if (!open) return null;

  let i = open.index + open[0].length;
  let depth = 1;

  while (depth > 0 && i < html.length) {
    const nextOpen = html.indexOf('<div', i);
    const nextClose = html.indexOf('</div>', i);

    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
    }
  }

  return html.slice(open.index + open[0].length, i - 6);
}

// Fetch LinkedIn jobs using public guest endpoints
async function fetchLinkedIn(query, days, limit, state) {
  const results = [];
  const effectiveDays = Math.max(days || 30, 30);
  const cutoff = Date.now() - (effectiveDays * 24 * 60 * 60 * 1000);

  const offsets = [0, 25];
  for (const offset of offsets) {
    if (results.length >= limit) break;
    const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&location=Colombia&start=${offset}`;
    
    try {
      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
        }
      });
      if (!res.ok) {
        if (res.status !== 429) console.error(`[linkedin] Search status ${res.status} for "${query}" (start=${offset})`);
        continue;
      }
      const html = await res.text();
      const chunks = html.split(/data-entity-urn="urn:li:jobPosting:/).slice(1);

      for (const chunk of chunks) {
        if (results.length >= limit) break;

        const idMatch = chunk.match(/^(\d+)/);
        if (!idMatch) continue;
        const id = idMatch[1];

        const titleMatch = chunk.match(/class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i);
        const compMatch = chunk.match(/class="base-search-card__subtitle"[^>]*>([\s\S]*?)<\/h4>/i);
        const locMatch = chunk.match(/class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i);
        const dtMatch = chunk.match(/datetime="([^"]+)"/i);
        const linkMatch = chunk.match(/class="base-card__full-link[^"]*"[^>]*href="([^"]+)"/i);

        const title = titleMatch ? decodeHTML(titleMatch[1]) : 'Untitled';
        const company = compMatch ? decodeHTML(compMatch[1]) : 'LinkedIn Employer';
        const location = locMatch ? decodeHTML(locMatch[1]) : 'Colombia';
        const dateStr = dtMatch ? dtMatch[1] : new Date().toISOString().slice(0, 10);
        const url = linkMatch ? linkMatch[1].split('?')[0] : `https://www.linkedin.com/jobs/view/${id}`;

        // Date cutoff
        const pubDateMs = Date.parse(dateStr);
        if (pubDateMs && pubDateMs < cutoff) continue;

        // Dedup against seen URLs and company+role
        if (state.seenUrls.has(url.toLowerCase())) continue;
        if (state.seenCompanyRoles.has(`${company.toLowerCase()}|${title.toLowerCase()}`)) continue;

      // Fetch detail for full description and closed state check
      let description = '';
      let isActive = true;
      try {
        const detailRes = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
          }
        });
        if (detailRes.ok) {
          const detailHtml = await detailRes.text();
          const descStart = detailHtml.search(/class="(?:show-more-less-html__markup|description__text)/i);
          const topcard = descStart === -1 ? detailHtml : detailHtml.slice(0, descStart);
          if (/closed-job__flavor|no longer accepting applications/i.test(topcard)) {
            isActive = false;
          } else {
            const descMarkup = extractDivContent(detailHtml, "show-more-less-html__markup") ?? extractDivContent(detailHtml, "description__text");
            if (descMarkup) {
              description = decodeHTML(descMarkup);
            }
          }
        }
      } catch (e) {
        // detail fetch error non-fatal
      }

      if (!isActive) continue;

      const langCheck = evaluateLanguage(description, company);
      const fit = evaluateFit(title, description, location, company);

      results.push({
        id,
        title,
        company,
        location,
        date: dateStr,
        deadline: null,
        url,
        portal: 'linkedin-search',
        source: 'html',
        fit,
        salary: null,
        language_gate: langCheck.gate,
        language_note: langCheck.note,
        description: description || `Posición en LinkedIn: ${title} en ${company}.`
      });
    }
  } catch (err) {
    console.error(`[linkedin] Error: ${err.message}`);
  }
}

  return results;
}

// Main execution
async function main() {
  const flags = parseArgs();
  const state = loadState();

  let allResults = [];

  const shouldFetchGetOnBrd = flags.portal === 'all' || flags.portal === 'getonbrd';
  const shouldFetchWWR = flags.portal === 'all' || flags.portal === 'weworkremotely';
  const shouldFetchHimalayas = flags.portal === 'all' || flags.portal === 'himalayas';
  const shouldFetchRemote100k = flags.portal === 'all' || flags.portal === 'remote100k';
  const shouldFetchTorre = flags.portal === 'all' || flags.portal === 'torre';
  const shouldFetchLinkedIn = flags.portal === 'all' || flags.portal === 'linkedin';

  const queries = flags.query ? [flags.query] : [
    'salesforce developer',
    'desarrollador salesforce',
    'frontend react',
    'desarrollador react',
    'next.js',
    'desarrollador frontend',
    'nestjs',
    'node.js',
    'full stack developer'
  ];

  for (const q of queries) {
    if (shouldFetchGetOnBrd) {
      const gobJobs = await fetchGetOnBrd(q, flags.days, flags.limit, state);
      allResults.push(...gobJobs);
    }
    if (shouldFetchWWR) {
      const wwrJobs = await fetchWeWorkRemotely(q, flags.days, flags.limit, state);
      allResults.push(...wwrJobs);
    }
    if (shouldFetchHimalayas) {
      const himJobs = await fetchHimalayas(q, flags.days, flags.limit, state);
      allResults.push(...himJobs);
    }
    if (shouldFetchRemote100k) {
      const r100kJobs = await fetchRemote100k(q, flags.days, flags.limit, state);
      allResults.push(...r100kJobs);
    }
    if (shouldFetchTorre) {
      const torreJobs = await fetchTorre(q, flags.days, flags.limit, state);
      allResults.push(...torreJobs);
    }
    if (shouldFetchLinkedIn) {
      const liJobs = await fetchLinkedIn(q, flags.days, flags.limit, state);
      allResults.push(...liJobs);
    }
  }

  // Deduplicate within this run's results by URL
  const seenThisRun = new Set();
  allResults = allResults.filter(job => {
    if (!job.url || seenThisRun.has(job.url)) return false;
    seenThisRun.add(job.url);
    return true;
  });

  // Sort by fit: High first, then Medium, then Low
  const fitOrder = { high: 0, medium: 1, low: 2 };
  allResults.sort((a, b) => (fitOrder[a.fit] ?? 3) - (fitOrder[b.fit] ?? 3));

  const output = {
    meta: {
      timestamp: new Date().toISOString(),
      count: allResults.length,
      portals: [
        shouldFetchGetOnBrd ? 'getonbrd' : null,
        shouldFetchWWR ? 'weworkremotely' : null,
        shouldFetchHimalayas ? 'himalayas' : null,
        shouldFetchRemote100k ? 'remote100k' : null,
        shouldFetchTorre ? 'torre' : null,
        shouldFetchLinkedIn ? 'linkedin' : null
      ].filter(Boolean),
      query: flags.query || 'multi'
    },
    results: allResults
  };

  // 1. Always persist to last_scrape_results.json
  const defaultOutputPath = path.join(ROOT, 'job_scraper', 'last_scrape_results.json');
  fs.writeFileSync(flags.output || defaultOutputPath, JSON.stringify(output, null, 2), 'utf8');

  // 2. Always persist new entries to seen_jobs.json
  const seenJobsPath = path.join(ROOT, 'job_scraper', 'seen_jobs.json');
  if (fs.existsSync(seenJobsPath)) {
    try {
      const seenJson = JSON.parse(fs.readFileSync(seenJobsPath, 'utf8'));
      seenJson.seen = seenJson.seen || {};
      for (const job of allResults) {
        const key = (job.id || `${job.company}_${job.title}`).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        if (!seenJson.seen[key]) {
          seenJson.seen[key] = {
            title: job.title,
            company: job.company,
            url: job.url,
            first_seen: job.date || new Date().toISOString().slice(0, 10),
            posted_date: job.date,
            deadline: job.deadline,
            fit: job.fit,
            status: 'new',
            location: job.location,
            portal: job.portal,
            source: job.source,
            salary: job.salary,
            descriptionSnippet: job.description
          };
        } else if (seenJson.seen[key].status !== 'applied' && seenJson.seen[key].status !== 'rejected') {
          seenJson.seen[key].fit = job.fit;
          if (job.description) seenJson.seen[key].descriptionSnippet = job.description;
        }
      }
      fs.writeFileSync(seenJobsPath, JSON.stringify(seenJson, null, 2), 'utf8');
    } catch (err) {
      console.error('Error updating seen_jobs.json:', err.message);
    }
  }

  // 3. Format output
  if (flags.format === 'table') {
    console.log(`\nFound ${allResults.length} new matching positions:\n`);
    console.table(allResults.map(r => ({
      Fit: r.fit.toUpperCase(),
      Title: r.title.length > 35 ? r.title.slice(0, 32) + '...' : r.title,
      Company: r.company.length > 25 ? r.company.slice(0, 22) + '...' : r.company,
      Location: r.location,
      Portal: r.portal,
      Date: r.date,
      URL: r.url
    })));
  } else if (!flags.output) {
    console.log(JSON.stringify(output, null, 2));
  }

  // 4. Automatically update the static markdown dashboard
  try {
    generateScrapeMarkdown();
  } catch (e) {
    // Non-fatal
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
