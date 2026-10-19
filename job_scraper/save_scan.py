import json
import sys
from pathlib import Path
from urllib.parse import quote

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from tools.job_key import make_key

folder = root / 'job_scraper'
scan = json.loads((folder / 'scan_2026-09-20.json').read_text(encoding='utf-8'))
path = folder / 'seen_jobs.json'
state = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {'seen': {}}
report = ['# Resultado de /scrape — 2026-09-20', '', '5 vacantes seleccionadas: 1 alta, 2 medias y 2 bajas. Evaluación preliminar, no /rank.', '', 'fallback (websearch): linkedin-search, freehire-search. Bun no disponible. Las copias indexadas pueden estar desactualizadas; disponibilidad final por confirmar.', '', 'skipped (disabled): jobbank-search, jobdanmark-search, jobindex-search, jobnet-search.', '', 'Salarios, jornada sin noches/fines de semana e idioma efectivo del equipo requieren confirmación. Ninguna postulación enviada.', '', 'Fechas relativas conservadas tal como aparecen; no se convierten a fechas absolutas a partir de copias indexadas.', '']
for row in scan['rows']:
    company,title,url,fit,status,location,date_text,notes,deadline = row
    key = make_key(company,title,url)
    entry = dict(company=company,title=title,url=url,first_seen=scan['date'],posted_date=date_text if date_text and len(date_text)==10 and date_text[4]=='-' else None,posted_date_text=date_text,deadline=deadline,fit=fit,status=status,location=location,notes=notes,portal='freehire-search' if 'freehire.me' in url else 'linkedin-search' if 'linkedin.com' in url else 'web',source='websearch')
    if key not in state['seen'] and not any(v.get('url')==url for v in state['seen'].values()):
        state['seen'][key]=entry
    if status=='new':
        report += [f'## {company} — {title}', '', f'- Ajuste: {fit}. Ubicación: {location}.', f'- Publicación: {date_text or "desconocida"}. Cierre: {deadline or "no publicado"}.', f'- [Vacante]({url})', f'- {notes}', '']
        if fit in ('high','medium'):
            role = 'Salesforce' if 'Salesforce' in title else 'NestJS'
            for label,query in [('Reclutadores',company+' recruiter'),('Equipo',company+' '+role)]:
                report += [f'- [{label}: búsqueda en LinkedIn](https://www.linkedin.com/search/results/people/?keywords={quote(query)}&origin=GLOBAL_SEARCH_HEADER)']
            report += ['']
report += ['## Otros resultados', '', 'Se registraron 17 resultados adicionales cerrados, fuera de alcance, antiguos o sin verificación suficiente. Consultar scan y seen_jobs para los motivos. No se incluyeron como coincidencias confirmadas.', '', 'Estado técnico de CLIs: no evaluado por ausencia de Bun; no hay evidencia para declararlos rotos.', '']
path.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(folder/'results_2026-09-20.md').write_text('\n'.join(report),encoding='utf-8')
print(json.dumps({'saved':len(scan['rows']),'new_matches':sum(r[4]=='new' for r in scan['rows'])}))
