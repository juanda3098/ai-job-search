import fs from 'fs';
import path from 'path';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ROOT = process.cwd();
const TRACKER_PATH = path.join(ROOT, 'job_search_tracker.csv');
const APPS_DIR = path.join(ROOT, 'documents', 'applications');
const OUTPUT_PATH = path.join(ROOT, 'reports', 'application-dashboard.html');

if (!fs.existsSync(TRACKER_PATH)) {
  console.error("Tracker file not found at " + TRACKER_PATH);
  process.exit(1);
}

// 1. Read CSV
let csvRaw = fs.readFileSync(TRACKER_PATH, 'utf8');
if (csvRaw.charCodeAt(0) === 0xFEFF) csvRaw = csvRaw.slice(1);

const lines = csvRaw.split(/\r?\n/).filter(line => line.trim().length > 0);
const headers = lines[0].split(',').map(h => h.trim());

const rows = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  // Basic CSV split
  const values = line.split(',');
  const row = {};
  headers.forEach((h, idx) => {
    row[h] = (values[idx] !== undefined) ? values[idx].trim() : '';
  });
  rows.push(row);
}

// 2. Read documents/applications/*/outcome.md
const outcomes = {};
if (fs.existsSync(APPS_DIR)) {
  const subdirs = fs.readdirSync(APPS_DIR);
  for (const dir of subdirs) {
    const outcomeFile = path.join(APPS_DIR, dir, 'outcome.md');
    if (fs.existsSync(outcomeFile)) {
      const content = fs.readFileSync(outcomeFile, 'utf8');
      outcomes[dir.toLowerCase()] = content;
    }
  }
}

// Attach outcome context
rows.forEach(r => {
  const key = `${r.company}_${r.role}`.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  r.outcomeContent = outcomes[key] || '';
});

// 3. Status normalization
function normalizeStatus(st) {
  const s = (st || '').trim().toLowerCase();
  if (s === 'drafted') return 'Drafted';
  if (s === 'applied') return 'Active';
  if (s === 'interview') return 'Interview';
  if (s === 'offer') return 'Offer';
  if (s === 'hired') return 'Hired';
  if (['rejected', 'no_response', 'no response', 'offer_declined', 'offer declined', 'withdrawn'].includes(s)) {
    return 'Rejected/Closed';
  }
  return 'Rejected/Closed';
}

rows.forEach(r => {
  r.canonicalStatus = normalizeStatus(r.status);
});

// Compute stats
const totalApps = rows.length;
const draftedRows = rows.filter(r => r.canonicalStatus === 'Drafted');
const sentRows = rows.filter(r => r.canonicalStatus !== 'Drafted');

const statusCounts = {
  'Drafted': rows.filter(r => r.canonicalStatus === 'Drafted').length,
  'Active': rows.filter(r => r.canonicalStatus === 'Active').length,
  'Interview': rows.filter(r => r.canonicalStatus === 'Interview').length,
  'Offer': rows.filter(r => r.canonicalStatus === 'Offer').length,
  'Hired': rows.filter(r => r.canonicalStatus === 'Hired').length,
  'Rejected/Closed': rows.filter(r => r.canonicalStatus === 'Rejected/Closed').length
};

const sectorCounts = {};
sentRows.forEach(r => {
  const sec = r.sector || 'Unspecified';
  sectorCounts[sec] = (sectorCounts[sec] || 0) + 1;
});
const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);

const channelCounts = {};
sentRows.forEach(r => {
  const ch = r.channel || 'Other';
  channelCounts[ch] = (channelCounts[ch] || 0) + 1;
});
const sortedChannels = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);

// Funnel stages reached
let reachedApplied = sentRows.length;
let reachedInterview = 0;
let reachedOffer = 0;
let reachedHired = 0;

sentRows.forEach(r => {
  const st = r.canonicalStatus;
  const oc = (r.outcomeContent || '').toLowerCase();
  const hadInterview = st === 'Interview' || st === 'Offer' || st === 'Hired' || oc.includes('[x] phone screen') || oc.includes('[x] technical interview') || oc.includes('[x] case interview') || oc.includes('[x] final round');
  const hadOffer = st === 'Offer' || st === 'Hired' || oc.includes('[x] offer received');
  const hadHired = st === 'Hired';

  if (hadInterview) reachedInterview++;
  if (hadOffer) reachedOffer++;
  if (hadHired) reachedHired++;
});

// Build SVGs
// 1. Doughnut chart
const statusColors = {
  'Drafted': '#64748b',
  'Active': '#3b82f6',
  'Interview': '#f59e0b',
  'Offer': '#8b5cf6',
  'Hired': '#22c55e',
  'Rejected/Closed': '#ef4444'
};

function buildDoughnutSVG() {
  const total = rows.length;
  if (total === 0) return '<svg width="220" height="220"><text x="110" y="115" text-anchor="middle" fill="#888">No data</text></svg>';
  
  const entries = Object.entries(statusCounts).filter(([_, c]) => c > 0);
  let cumulativeAngle = 0;
  const cx = 110, cy = 110, r = 80, innerR = 48;
  
  const paths = entries.map(([status, count]) => {
    const angle = (count / total) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;
    
    // Polar to Cartesian
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    // If single slice = full circle
    if (angle >= 359.99) {
      return `<circle cx="${cx}" cy="${cy}" r="${(r + innerR)/2}" fill="none" stroke="${statusColors[status]}" stroke-width="${r - innerR}" />`;
    }
    
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;
    return `<path d="${d}" fill="${statusColors[status]}" />`;
  }).join('\n');
  
  return `
    <svg width="220" height="220" viewBox="0 0 220 220" role="img" aria-label="Status breakdown doughnut chart">
      ${paths}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="22" font-weight="bold" fill="#1e293b">${total}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="#64748b">Total Apps</text>
    </svg>
  `;
}

// 2. Sector Horizontal Bar
function buildSectorBarSVG() {
  const maxVal = Math.max(...sortedSectors.map(s => s[1]), 1);
  const chartW = 320;
  const barH = 22;
  const gap = 12;
  const totalH = sortedSectors.length * (barH + gap) + 10;
  
  const bars = sortedSectors.map(([sec, count], idx) => {
    const y = idx * (barH + gap) + 10;
    const w = Math.round((count / maxVal) * 160);
    return `
      <g>
        <text x="0" y="${y + 15}" font-size="12" fill="#334155">${escapeHtml(sec)}</text>
        <rect x="150" y="${y}" width="${w}" height="${barH}" rx="4" fill="#3b82f6" />
        <text x="${155 + w}" y="${y + 16}" font-size="12" font-weight="bold" fill="#1e293b">${count}</text>
      </g>
    `;
  }).join('\n');
  
  return `
    <svg width="100%" height="${totalH}" viewBox="0 0 ${chartW} ${totalH}" role="img" aria-label="Applications by sector bar chart">
      ${bars}
    </svg>
  `;
}

// 3. Channel Bar
function buildChannelBarSVG() {
  const maxVal = Math.max(...sortedChannels.map(s => s[1]), 1);
  const chartW = 320;
  const barH = 22;
  const gap = 12;
  const totalH = sortedChannels.length * (barH + gap) + 10;
  
  const bars = sortedChannels.map(([ch, count], idx) => {
    const y = idx * (barH + gap) + 10;
    const w = Math.round((count / maxVal) * 160);
    return `
      <g>
        <text x="0" y="${y + 15}" font-size="12" fill="#334155">${escapeHtml(ch)}</text>
        <rect x="130" y="${y}" width="${w}" height="${barH}" rx="4" fill="#8b5cf6" />
        <text x="${135 + w}" y="${y + 16}" font-size="12" font-weight="bold" fill="#1e293b">${count}</text>
      </g>
    `;
  }).join('\n');
  
  return `
    <svg width="100%" height="${totalH}" viewBox="0 0 ${chartW} ${totalH}" role="img" aria-label="Applications by channel bar chart">
      ${bars}
    </svg>
  `;
}

// 4. Funnel Bar
function buildFunnelBarSVG() {
  const stages = [
    { name: 'Applied', count: reachedApplied, color: '#3b82f6' },
    { name: 'Interview', count: reachedInterview, color: '#f59e0b' },
    { name: 'Offer', count: reachedOffer, color: '#8b5cf6' },
    { name: 'Hired', count: reachedHired, color: '#22c55e' }
  ];
  
  const base = reachedApplied || 1;
  const chartW = 320;
  const barH = 22;
  const gap = 14;
  const totalH = stages.length * (barH + gap) + 10;
  
  const bars = stages.map((stg, idx) => {
    const y = idx * (barH + gap) + 10;
    const w = Math.max(Math.round((stg.count / base) * 160), stg.count > 0 ? 6 : 0);
    const pct = reachedApplied > 0 ? Math.round((stg.count / reachedApplied) * 100) : 0;
    return `
      <g>
        <text x="0" y="${y + 15}" font-size="12" fill="#334155">${stg.name}</text>
        <rect x="90" y="${y}" width="${w}" height="${barH}" rx="4" fill="${stg.color}" />
        <text x="${96 + w}" y="${y + 16}" font-size="12" font-weight="bold" fill="#1e293b">${stg.count} <tspan font-weight="normal" fill="#64748b">(${pct}%)</tspan></text>
      </g>
    `;
  }).join('\n');
  
  return `
    <svg width="100%" height="${totalH}" viewBox="0 0 ${chartW} ${totalH}" role="img" aria-label="Application funnel stage progression">
      ${bars}
    </svg>
  `;
}

// Generate rows HTML
const tableRowsHtml = rows.map((r, i) => {
  const badgeColor = statusColors[r.canonicalStatus] || '#64748b';
  const notesTrunc = r.notes.length > 80 ? r.notes.slice(0, 77) + '...' : r.notes;
  const sourceHtml = r.source && r.source.startsWith('http') 
    ? `<a href="${escapeHtml(r.source)}" target="_blank" class="link-btn">Ver Link ↗</a>` 
    : (escapeHtml(r.source) || '—');
    
  return `
    <tr data-status="${escapeHtml(r.canonicalStatus)}" data-sector="${escapeHtml(r.sector)}" data-text="${escapeHtml((r.company + ' ' + r.role + ' ' + r.sector + ' ' + r.notes).toLowerCase())}">
      <td>${escapeHtml(r.date) || '—'}</td>
      <td>${escapeHtml(r.deadline) || '—'}</td>
      <td><strong>${escapeHtml(r.company)}</strong></td>
      <td>${escapeHtml(r.role)}</td>
      <td><span class="sector-tag">${escapeHtml(r.sector)}</span></td>
      <td>${escapeHtml(r.channel) || '—'}</td>
      <td><span class="badge" style="background-color: ${badgeColor}18; color: ${badgeColor}; border: 1px solid ${badgeColor}40;">${escapeHtml(r.canonicalStatus)}</span></td>
      <td title="${escapeHtml(r.notes)}">${escapeHtml(notesTrunc) || '—'}</td>
      <td>${sourceHtml}</td>
    </tr>
  `;
}).join('\n');

const sectorOptions = sortedSectors.map(([sec]) => `<option value="${escapeHtml(sec)}">${escapeHtml(sec)}</option>`).join('');

const htmlDoc = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Search Dashboard — ai-job-search</title>
  <style>
    :root {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --border: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --drafted: #64748b;
      --active: #3b82f6;
      --interview: #f59e0b;
      --offer: #8b5cf6;
      --hired: #22c55e;
      --rejected: #ef4444;
      --font: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 24px;
    }
    .container {
      max-width: 1240px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      background: #ffffff;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    
    /* Stat Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid var(--border);
      border-left: 5px solid #94a3b8;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .stat-card.sent { border-left-color: #0284c7; }
    .stat-card.active { border-left-color: var(--active); }
    .stat-card.interview { border-left-color: var(--interview); }
    .stat-card.offer { border-left-color: var(--offer); }
    .stat-card.hired { border-left-color: var(--hired); }
    .stat-card.rejected { border-left-color: var(--rejected); }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }
    
    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
      margin-bottom: 28px;
    }
    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
    }
    .chart-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 18px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .chart-card h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 16px;
      color: #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doughnut-layout {
      display: flex;
      align-items: center;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 12px;
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.85rem;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }
    
    /* Table Section */
    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      overflow: hidden;
      margin-bottom: 40px;
    }
    .table-header {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .table-title {
      font-size: 1.1rem;
      font-weight: 600;
    }
    .filters {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    input[type="text"], select {
      padding: 7px 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.85rem;
      background: #ffffff;
      color: var(--text);
      outline: none;
    }
    input[type="text"]:focus, select:focus {
      border-color: var(--active);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }
    .table-responsive {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    tr:nth-child(even) td {
      background-color: #fafbfc;
    }
    tr:hover td {
      background-color: #f1f5f9;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .sector-tag {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.78rem;
    }
    .link-btn {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .link-btn:hover {
      text-decoration: underline;
    }
    footer {
      text-align: center;
      font-size: 0.8rem;
      color: var(--text-muted);
      padding: 20px 0;
      border-top: 1px solid var(--border);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🎯 Job Application Dashboard</h1>
      <div class="header-meta">Generado: ${new Date().toISOString().slice(0, 10)} · Offline Dashboard</div>
    </header>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card sent">
        <div class="stat-number">${sentRows.length}</div>
        <div class="stat-label">Enviadas</div>
      </div>
      <div class="stat-card active">
        <div class="stat-number">${statusCounts['Active']}</div>
        <div class="stat-label">Activas</div>
      </div>
      <div class="stat-card interview">
        <div class="stat-number">${statusCounts['Interview']}</div>
        <div class="stat-label">Entrevistas</div>
      </div>
      <div class="stat-card offer">
        <div class="stat-number">${statusCounts['Offer']}</div>
        <div class="stat-label">Ofertas</div>
      </div>
      <div class="stat-card hired">
        <div class="stat-number">${statusCounts['Hired']}</div>
        <div class="stat-label">Contratado</div>
      </div>
      <div class="stat-card rejected">
        <div class="stat-number">${statusCounts['Rejected/Closed']}</div>
        <div class="stat-label">Cerradas / Rechazadas</div>
      </div>
    </div>

    <!-- Charts 2x2 Grid -->
    <div class="charts-grid">
      <div class="chart-card">
        <h3>Estado de Postulaciones</h3>
        <div class="doughnut-layout">
          ${buildDoughnutSVG()}
          <div class="legend">
            ${Object.entries(statusCounts).filter(([_, c]) => c > 0).map(([st, c]) => `
              <div class="legend-item">
                <div class="legend-color" style="background-color: ${statusColors[st]}"></div>
                <span>${st}: <strong>${c}</strong></span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>Postulaciones por Sector</h3>
        ${buildSectorBarSVG()}
      </div>

      <div class="chart-card">
        <h3>Postulaciones por Canal</h3>
        ${buildChannelBarSVG()}
      </div>

      <div class="chart-card">
        <h3>Embudo de Progresión</h3>
        ${buildFunnelBarSVG()}
      </div>
    </div>

    <!-- Interactive Table -->
    <div class="table-card">
      <div class="table-header">
        <div class="table-title">Historial de Aplicaciones (<span id="visibleCount">${rows.length}</span>)</div>
        <div class="filters">
          <input type="text" id="searchInput" placeholder="Buscar empresa, rol, notas...">
          <select id="statusFilter">
            <option value="">Todos los Estados</option>
            <option value="Active">Active</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Hired">Hired</option>
            <option value="Rejected/Closed">Rejected/Closed</option>
          </select>
          <select id="sectorFilter">
            <option value="">Todos los Sectores</option>
            ${sectorOptions}
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Límite</th>
              <th>Empresa</th>
              <th>Rol</th>
              <th>Sector</th>
              <th>Canal</th>
              <th>Estado</th>
              <th>Notas</th>
              <th>Vacante</th>
            </tr>
          </thead>
          <tbody id="tableBody">
            ${tableRowsHtml}
          </tbody>
        </table>
      </div>
    </div>

    <footer>
      Generated by Claude Code · ai-job-search · ${new Date().toISOString().slice(0, 10)}
    </footer>
  </div>

  <script>
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const sectorFilter = document.getElementById('sectorFilter');
    const tableBody = document.getElementById('tableBody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    const visibleCount = document.getElementById('visibleCount');

    function filterRows() {
      const q = (searchInput.value || '').trim().toLowerCase();
      const status = statusFilter.value;
      const sector = sectorFilter.value;

      let count = 0;
      rows.forEach(tr => {
        const rowText = tr.getAttribute('data-text') || '';
        const rowStatus = tr.getAttribute('data-status') || '';
        const rowSector = tr.getAttribute('data-sector') || '';

        const matchQuery = !q || rowText.includes(q);
        const matchStatus = !status || rowStatus === status;
        const matchSector = !sector || rowSector === sector;

        if (matchQuery && matchStatus && matchSector) {
          tr.style.display = '';
          count++;
        } else {
          tr.style.display = 'none';
        }
      });
      visibleCount.textContent = count;
    }

    searchInput.addEventListener('input', filterRows);
    statusFilter.addEventListener('change', filterRows);
    sectorFilter.addEventListener('change', filterRows);
  </script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, htmlDoc, 'utf8');
console.log("Dashboard written to " + OUTPUT_PATH);
