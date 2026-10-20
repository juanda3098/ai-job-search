#!/usr/bin/env node
/**
 * generate_scrape_md.mjs
 * Generates and updates the static job_scraper/latest_results.md markdown dashboard.
 * Consolidates all unapplied, active jobs across enabled portals, strictly enforcing:
 * 1. Stack fit (React, Next.js, TypeScript, Node.js, Nest.js, Salesforce Apex/LWC).
 * 2. Anti-stack veto (.NET, Angular, Go, Python backend, Sage X3, Java, PHP, Mobile).
 * 3. Role veto (Only Developer / Engineer / Tech Lead; excludes pure Administrator roles).
 * 4. Location gate (Colombia, LATAM, or Worldwide remote; excludes US-only/Canada-only).
 * 5. Language gate (Spanish native or English B1; excludes Fluent/C1 English).
 * 6. Exclusion of already applied positions.
 * 
 * Usage:
 *   node tools/generate_scrape_md.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

export function evaluateLanguage(text = '', company = '') {
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

export function evaluateFit(title, description, location, company = '') {
  const text = `${title} ${description || ''}`.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const loc = (location || '').toLowerCase();
  const comp = (company || '').toLowerCase();

  // 1. Non-dev / Admin veto (candidate is a SWE / Tech Lead, not an admin or recruiter)
  if (/\b(administrator|salesforce admin|administrador|marketing|sales|recruiter|talent acquisition|account executive|care coach|content writer|customer success|growth manager|b2b outreach|operations coordinator|inside sales|sdm|director|head of technology|manager|business analyst|qa|sdet|scrum master|consultor salesforce md)\b/i.test(lowerTitle) &&
      !/\b(developer|desarrollador|engineer|programmer|tech lead|architect)\b/i.test(lowerTitle)) {
    return 'low';
  }

  // Exclude malformed ADP / hash company names
  if (/^[a-f0-9]{8}-[a-f0-9]{4}/i.test(company || '')) {
    return 'low';
  }

  // 2. Strict Location Gate Veto: Candidate resides in Colombia.
  // Exclude positions that strictly demand US citizenship/residency or non-LATAM locations
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

  // Incompatible tech requirements in description
  const requiresAngular = /\b(angular\s*(2\+|\d+|developer|expert)|experiencia en angular|requerido:?\s*angular|dominio de angular)\b/i.test(text);
  const requiresDotNet = /\b(\.net\s*core|c#\s*developer|asp\.net|experiencia en \.net)\b/i.test(text);
  const requiresSage = /\b(sage\s*x3)\b/i.test(text);
  const requiresGoOrPythonBackend = /\b(go\s*or\s*python|golang\s*developer|senior\s*python\s*developer|strong go experience)\b/i.test(text) && !/\b(react|typescript)\b/i.test(lowerTitle);
  const requiresMobile = /\b(flutter|react native|ios developer|android developer|swift|kotlin mobile)\b/i.test(text) && !/\b(react\.js|full.?stack|frontend|salesforce)\b/i.test(lowerTitle);
  const requiresRuby = /\b(ruby\s*on\s*rails|rails\s*developer|experiencia en ruby|key skills:\s*ruby)\b/i.test(text);

  if (requiresAngular || requiresDotNet || requiresSage || requiresGoOrPythonBackend || requiresMobile || requiresRuby) {
    return 'low';
  }

  // 4. Strict Language Gate Veto (Fluent English / C1 / Advanced)
  const lang = evaluateLanguage(text, company);
  if (lang.gate === 'FLAG') {
    return 'low';
  }

  // 5. Positive High Match
  // A. Salesforce Developer (Apex, LWC, Aura)
  if (/\b(salesforce)\b/i.test(text) &&
      /\b(developer|desarrollador|engineer|consultor t[eé]cnico|technical consultant)\b/i.test(lowerTitle) &&
      !/\b(admin|administrator|administrador|functional)\b/i.test(lowerTitle)) {
    return 'high';
  }

  // B. React / Next.js primary roles
  if (/\b(react|react\.js|next\.js)\b/i.test(lowerTitle) && !titleHasAntiStack) {
    return 'high';
  }

  // C. Full-Stack / Software Engineer with explicit React / Next.js and TypeScript / Node / NestJS
  if (/\b(full.?stack|desarrollador|software engineer|ingeniero de software|frontend|front-end)\b/i.test(lowerTitle) &&
      /\b(react|next\.js)\b/i.test(text) && /\b(typescript|node|nest\.?js)\b/i.test(text) && !titleHasAntiStack) {
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

export function buildMarkdownContent(jobs, meta = {}) {
  const now = meta.updatedAt || new Date().toISOString().replace('T', ' ').slice(0, 16);
  const total = jobs.length;
  const highJobs = jobs.filter(j => (j.fit || '').toLowerCase() === 'high');
  const medJobs = jobs.filter(j => (j.fit || '').toLowerCase() === 'medium');
  const lowJobs = jobs.filter(j => (j.fit || '').toLowerCase() === 'low');

  const lines = [
    `# 📋 Vacantes Activas Consolidadas (/scrape)`,
    ``,
    `> **Última actualización:** ${now} UTC  `,
    `> **Total de vacantes registradas:** ${total} (${highJobs.length} Alta afinidad 🟢, ${medJobs.length} Media 🟡, ${lowJobs.length} Baja ⚪)  `,
    `> **Filtros estrictos aplicados:**  `,
    `> - ❌ **Tecnologías incompatibles vetadas:** Se descartan de Alta/Media roles con .NET/C#, Angular, Go, Python backend, Sage X3 o Java.  `,
    `> - ❌ **Filtro de Rol:** Excluidos roles de Administrador puro o no técnicos.  `,
    `> - ❌ **Filtro Geográfico (Location Gate):** Excluidas ofertas restringidas exclusivamente a residentes de EE. UU., Canadá, etc.  `,
    `> - ❌ **Filtro de Idioma (Language Gate):** Se descartan roles con inglés fluido/C1 excluyente (perfil del candidato: Inglés B1).  `,
    `> - ❌ **Exclusión de postuladas:** Se ocultan vacantes a las que ya aplicaste (disponibles en HTML y CSV tracker).  `,
    ``,
    `---`,
    ``,
    `## 📊 Tabla General de Vacantes Pendientes de Postulación`,
    ``,
    `| # | Ajuste | Cargo | Empresa | Ubicación | Salario / Plazo | Portal | Enlace |`,
    `|:---:|:---:|---|---|---|---|:---:|:---:|`
  ];

  jobs.forEach((job, index) => {
    const num = index + 1;
    const fitLower = (job.fit || 'medium').toLowerCase();
    const fitBadge = fitLower === 'high' ? '🟢 **High**' : fitLower === 'medium' ? '🟡 Medium' : '⚪ Low';
    const title = (job.title || 'N/A').replace(/\|/g, '-');
    const company = (job.company || 'N/A').replace(/\|/g, '-');
    const location = (job.location || '100% Remoto').replace(/\|/g, '-');
    const salary = (job.salary || 'No divulgado').replace(/\|/g, '-');
    const portal = (job.portal || 'web')
      .replace(/-search$/, '')
      .replace(/^getonbrd$/, 'Get on Board')
      .replace(/^weworkremotely$/, 'We Work Remotely')
      .replace(/^himalayas$/, 'Himalayas')
      .replace(/^torre$/, 'Torre.ai')
      .replace(/^remote100k$/, 'Remote100k')
      .replace(/^freehire$/, 'FreeHire')
      .replace(/^linkedin$/, 'LinkedIn');
    const link = job.url ? `[Ver Vacante](${job.url})` : 'N/A';

    lines.push(`| **${num}** | ${fitBadge} | ${title} | ${company} | ${location} | ${salary} | ${portal} | ${link} |`);
  });

  // High Match Highlights
  if (highJobs.length > 0) {
    lines.push(``, `---`, ``, `## 🎯 Vacantes Destacadas (High Fit)`, ``);
    lines.push(`Estas posiciones tienen una coincidencia real y comprobada con tu stack (React, Next.js, TypeScript, Node.js, arquitectura SaaS/CRM) y tu nivel de idioma.`);
    lines.push(``);

    highJobs.forEach((job, idx) => {
      const recQuery = encodeURIComponent(`${job.company} recruiter`);
      const peerQuery = encodeURIComponent(`${job.company} software engineer`);
      const portalClean = (job.portal || 'portal')
        .replace(/-search$/, '')
        .replace(/^getonbrd$/, 'Get on Board')
        .replace(/^weworkremotely$/, 'We Work Remotely')
        .replace(/^himalayas$/, 'Himalayas')
        .replace(/^torre$/, 'Torre.ai')
        .replace(/^freehire$/, 'FreeHire')
        .replace(/^linkedin$/, 'LinkedIn');

      lines.push(`### #${idx + 1} ${job.title} — **${job.company}** (${portalClean})`);
      lines.push(`- **Ubicación / Modalidad:** ${job.location || '100% Remoto'}`);
      if (job.salary && job.salary !== 'No divulgado') {
        lines.push(`- **Salario:** ${job.salary}`);
      }
      lines.push(`- **Enlace directo:** [Postularse en ${job.company}](${job.url})`);
      if (job.language_gate) {
        lines.push(`- **Filtro de Idioma (Language Gate):** \`${job.language_gate}\` ${job.language_note ? `(${job.language_note})` : ''}`);
      }
      if (job.reasons && Array.isArray(job.reasons) && job.reasons.length > 0) {
        lines.push(`- **Puntos de encaje:** ${job.reasons.join(', ')}`);
      }
      if (job.descriptionSnippet || job.description) {
        const desc = (job.descriptionSnippet || job.description)
          .replace(/\s+/g, ' ')
          .slice(0, 240);
        lines.push(`- **Detalle de la vacante:** ${desc}...`);
      }
      lines.push(`- **Contactos sugeridos en LinkedIn para referidos:**`);
      lines.push(`  - [Buscar Reclutadores / TA en ${job.company}](https://www.linkedin.com/search/results/people/?keywords=${recQuery}&origin=GLOBAL_SEARCH_HEADER)`);
      lines.push(`  - [Buscar Desarrolladores / Peers en ${job.company}](https://www.linkedin.com/search/results/people/?keywords=${peerQuery}&origin=GLOBAL_SEARCH_HEADER)`);
      lines.push(``);
    });
  }

  // Medium Match Highlights summary
  if (medJobs.length > 0) {
    lines.push(``, `---`, ``, `## 🟡 Vacantes de Media Afinidad (Medium Fit)`, ``);
    lines.push(`Posiciones adyacentes o de tecnologías complementarias (sin tecnologías incompatibles):`);
    lines.push(``);
    medJobs.forEach((job, idx) => {
      const portalClean = (job.portal || 'portal')
        .replace(/-search$/, '')
        .replace(/^getonbrd$/, 'Get on Board')
        .replace(/^weworkremotely$/, 'We Work Remotely')
        .replace(/^himalayas$/, 'Himalayas')
        .replace(/^torre$/, 'Torre.ai')
        .replace(/^freehire$/, 'FreeHire')
        .replace(/^linkedin$/, 'LinkedIn');
      lines.push(`- **#${idx + 1} ${job.title}** en **${job.company}** (${job.location || 'Remoto'}) · *${portalClean}* — [Ver vacante](${job.url})`);
    });
    lines.push(``);
  }

  return lines.join('\n') + '\n';
}

export function generateScrapeMarkdown(options = {}) {
  // Load tracker to collect applied positions
  const trackerPath = path.join(ROOT, 'job_search_tracker.csv');
  const appliedTrackerKeys = new Set();
  const appliedTrackerUrls = new Set();
  if (fs.existsSync(trackerPath)) {
    const lines = fs.readFileSync(trackerPath, 'utf8').split('\n').filter(Boolean);
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const company = cols[1]?.trim().toLowerCase();
      const role = cols[3]?.trim().toLowerCase();
      const status = cols[6]?.trim().toLowerCase();
      const sourceUrl = cols[12]?.trim().toLowerCase();
      if (status === 'applied') {
        if (company && role) appliedTrackerKeys.add(`${company}|${role}`);
        if (sourceUrl) appliedTrackerUrls.add(sourceUrl);
      }
    }
  }

  // Also check seen_jobs.json for applied statuses
  const seenPath = path.join(ROOT, 'job_scraper', 'seen_jobs.json');
  if (fs.existsSync(seenPath)) {
    try {
      const seenData = JSON.parse(fs.readFileSync(seenPath, 'utf8')).seen || {};
      for (const [k, v] of Object.entries(seenData)) {
        if (v.status === 'applied') {
          if (v.url) appliedTrackerUrls.add(v.url.toLowerCase());
          if (v.company && v.title) {
            appliedTrackerKeys.add(`${v.company.toLowerCase()}|${v.title.toLowerCase()}`);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const pool = new Map();

  // Source 1: Provided directly in options
  if (options.jobs && Array.isArray(options.jobs)) {
    for (const j of options.jobs) {
      const k = (j.url || `${j.company}|${j.title}`).toLowerCase();
      pool.set(k, j);
    }
  } else {
    // Source 2: last_scrape_results.json
    const lastScrapePath = path.join(ROOT, 'job_scraper', 'last_scrape_results.json');
    if (fs.existsSync(lastScrapePath)) {
      try {
        const lastScrape = JSON.parse(fs.readFileSync(lastScrapePath, 'utf8'));
        if (lastScrape.results && Array.isArray(lastScrape.results)) {
          for (const j of lastScrape.results) {
            const k = (j.url || `${j.company}|${j.title}`).toLowerCase();
            pool.set(k, j);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Source 3: Merge active unapplied entries from seen_jobs.json
    if (fs.existsSync(seenPath)) {
      try {
        const seenData = JSON.parse(fs.readFileSync(seenPath, 'utf8')).seen || {};
        for (const [k, v] of Object.entries(seenData)) {
          if (v.status === 'applied' || v.status === 'skipped' || v.status === 'rejected') continue;
          const key = (v.url || `${v.company}|${v.title}`).toLowerCase();
          if (!pool.has(key)) {
            pool.set(key, { key: k, ...v });
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }

  const rawJobs = Array.from(pool.values());

  // Re-evaluate fit strictly against Juan David's profile and filter out applied jobs
  const filteredJobs = [];
  for (const job of rawJobs) {
    if (job.status === 'applied' || job.status === 'skipped' || job.status === 'rejected') continue;
    const urlLower = (job.url || '').toLowerCase();
    if (appliedTrackerUrls.has(urlLower)) continue;
    const companyRole = `${(job.company || '').toLowerCase()}|${(job.title || '').toLowerCase()}`;
    if (appliedTrackerKeys.has(companyRole)) continue;

    // Filter out third-party ad aggregator tracking links that do not resolve directly to postings
    if (urlLower.includes('whatjobs.com') || urlLower.includes('adzuna.com')) continue;

    const desc = `${job.title} ${job.notes || ''} ${job.descriptionSnippet || ''} ${job.description || ''}`;
    let lang = evaluateLanguage(desc, job.company);
    if (job.language_gate === 'FLAG') {
      lang = { gate: 'FLAG', note: job.language_note || 'Requiere inglés avanzado / profesional / C1 / fluido / excelente' };
    }
    let evaluatedFit = evaluateFit(job.title, desc, job.location, job.company);
    if (lang.gate === 'FLAG') {
      evaluatedFit = 'low';
    }
    filteredJobs.push({
      ...job,
      fit: evaluatedFit,
      language_gate: lang.gate,
      language_note: lang.note
    });
  }

  // Priority scoring for ranking:
  // 1. High match > Medium match > Low match
  // 2. Colombia location > LATAM/Remoto > Worldwide
  // 3. Recency
  function scoreJob(j) {
    let score = 0;
    if (j.fit === 'high') score += 1000;
    else if (j.fit === 'medium') score += 500;

    const loc = (j.location || '').toLowerCase();
    if (loc.includes('colombia')) score += 100;
    else if (loc.includes('latam') || loc.includes('remoto')) score += 50;
    else if (loc.includes('worldwide') || loc.includes('world')) score += 25;

    return score;
  }

  filteredJobs.sort((a, b) => scoreJob(b) - scoreJob(a));

  // Deduplicate by company + role title so multiple duplicate listings of the same job are merged
  const seenCompanyTitle = new Set();
  const dedupedJobs = [];
  for (const job of filteredJobs) {
    const key = `${(job.company || '').toLowerCase()}|${(job.title || '').toLowerCase()}`;
    if (seenCompanyTitle.has(key)) continue;
    seenCompanyTitle.add(key);
    dedupedJobs.push(job);
  }

  const mdContent = buildMarkdownContent(dedupedJobs, {
    updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  const targetFile = options.targetFile || path.join(ROOT, 'job_scraper', 'latest_results.md');
  fs.writeFileSync(targetFile, mdContent, 'utf8');
  console.log(`Successfully generated ${targetFile} with ${dedupedJobs.length} strictly evaluated jobs.`);
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('generate_scrape_md.mjs')) {
  generateScrapeMarkdown();
}
