# Search Queries for Job Scraper

Configuración de /setup: Juan David Posso Rengifo, 2026-09-18.

## Installed portal CLIs (primary for /scrape)
Descubrir skills habilitadas bajo .agents/skills/. LinkedIn y FreeHire están habilitados. Jobindex, Jobbank, Jobdanmark y Jobnet permanecen deshabilitados, por no corresponder al mercado solicitado.
Los comandos, parámetros y filtros se consultan en el SKILL.md de cada portal al ejecutar /scrape. No se ejecutó una búsqueda durante setup.

## Search Sites
- LinkedIn y FreeHire mediante sus CLI.
- Get on Board (`getonbrd.com`): API pública y búsquedas para empleo tech remoto en LATAM y Colombia.
- We Work Remotely (`weworkremotely.com`): Feeds RSS y búsquedas remotas globales compatibles con LATAM.
- Himalayas (`himalayas.app`): API pública de empleos remotos globales con salarios y restricciones por país/zona horaria.
- Remote100k (`remote100k.com`): Portal de empleos remotos de alta compensación ($100k+ USD) para ingeniería de software.
- Torre.ai (`torre.ai`): Portal de empleo y talento remoto líder en Colombia y LATAM con subtorres de ingeniería y salarios en USD/COP.
- Búsqueda web como respaldo cuando falle un CLI y para páginas oficiales de empresas.
- Mercado Libre es una empresa de interés declarada. Descubrir su página oficial de empleos al buscar; no asumir que tiene vacantes compatibles.
- Consultoras y empresas grandes, sin lista adicional obligatoria.

## Query Categories
Buscar por función; combinar títulos en español e inglés con Cali, Colombia o remoto desde Colombia. Preferir trabajo en español. Los títulos ingleses no implican un requisito de inglés fluido. Ejecutar variantes por separado cuando un portal no soporte OR.
Prioridades iniciales basadas en el orden mencionado por el candidato, ajustables.

### Priority 1: Desarrollo de interfaces con React
Títulos: Desarrollador Frontend, Desarrollador React, Frontend Developer, React Developer.
Consultas de respaldo:
- site:linkedin.com/jobs "React" "Cali"
- site:linkedin.com/jobs "desarrollador frontend" "Colombia"
- site:linkedin.com/jobs "React Developer" "remote" "Colombia"
- site:getonbrd.com/jobs "React" "remote"
- site:weworkremotely.com "React"
- site:himalayas.app "React"
- site:remote100k.com "React"
- site:torre.ai/post "React"

### Priority 2: Desarrollo Salesforce
Títulos: Desarrollador Salesforce, Salesforce Developer.
Términos distintivos: Apex, Aura Components, Lightning Web Components.
Consultas de respaldo:
- site:linkedin.com/jobs "desarrollador Salesforce" "Colombia"
- site:linkedin.com/jobs "Salesforce Developer" "remote" "Latin America"
- site:linkedin.com/jobs "Apex" "Aura" "Colombia"
- site:getonbrd.com/jobs "Salesforce"
- site:weworkremotely.com "Salesforce"
- site:himalayas.app "Salesforce"
- site:torre.ai/post "Salesforce"

### Priority 3: Desarrollo full stack
Títulos: Desarrollador Full Stack, Full Stack Developer.
Términos: React, Node.js, NestJS, MySQL.
Consultas de respaldo:
- site:linkedin.com/jobs "desarrollador full stack" "Colombia"
- site:linkedin.com/jobs "Full Stack Developer" "React" "Colombia"
- site:getonbrd.com/jobs "Full Stack" "remote"
- site:weworkremotely.com "Full Stack"
- site:himalayas.app "Full Stack"
- site:remote100k.com "Full Stack"
- site:torre.ai/post "Full Stack"

### Priority 4: Ingeniería de software y consultoría técnica
Títulos amplios: Ingeniero de Software, Software Engineer.
Roles adyacentes sugeridos para revisión, no preferencias confirmadas: Consultor Técnico Salesforce / Salesforce Technical Consultant. Su experiencia con Salesforce, DDD y acompañamiento técnico es transferible; verificar tareas y requisitos. No buscar liderazgo como prioridad sin solicitud del candidato.
Consultas de respaldo:
- site:linkedin.com/jobs "ingeniero de software" "React" "Colombia"
- site:linkedin.com/jobs "Software Engineer" "Salesforce" "Colombia"
- site:getonbrd.com/jobs "Software Engineer" "remote"
- site:weworkremotely.com "Software Engineer"
- site:himalayas.app "Software Engineer"
- site:remote100k.com "Software Engineer"
- site:torre.ai/post "Software Engineer"
- "Mercado Libre" "empleos" "frontend" "Colombia"
- "Mercado Libre" "careers" "software engineer" "Colombia"
- "consultora" "desarrollador Salesforce" "remoto" "Colombia"

## Location Filter
- Ideal: Cali presencial/híbrido, o remoto desde Colombia.
- Aceptable: empresas internacionales que contraten personas residentes en Colombia.
- Requiere aclaración: desplazamientos fuera de Cali, oficinas ocasionales en otra ciudad, límites de país o huso horario ambiguos.
- Fuera del alcance: reubicación obligatoria, presencial/híbrido fuera de Cali, remoto restringido a residentes de otros países.
No inferir ciudadanía ni permisos de trabajo a partir de la ubicación.

## Language Filter
Español nativo, inglés B1. Priorizar equipos y trabajo en español. Aplicar el Language Gate de 04-job-evaluation.md: idioma exigido no declarado, FAIL; requisito superior a B1 en inglés, FLAG y continuar con advertencia visible, no exclusión automática. La lengua del anuncio no prueba la del trabajo.
CV y carta en el idioma de cada vacante por decisión explícita del candidato.

## Schedule, Compensation and Culture
- Excluir turnos nocturnos o trabajo obligatorio los fines de semana.
- Aspiración mensual: 10.000.000 COP o 3.500 USD según contratación; no tratar como equivalentes cambiarios ni mínimos confirmados. Bruto/neto y contrato no especificados.
- Beneficios deseados, no excluyentes: medicina prepagada, cursos y gimnasios.
- Priorizar confianza, autonomía y buen ambiente. Investigar señales de micromanagement.

## Date Filter
Vacantes de los últimos 14 días o con plazo vigente. Si no se conoce fecha, marcar como fecha desconocida; comprobar vigencia en la fuente.

## Adapting Queries
Ante un enfoque específico de /scrape, seleccionar la categoría y añadir 2-3 variantes; preservar ubicación, horarios y Language Gate.
