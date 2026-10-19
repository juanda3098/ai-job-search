---
name: application-email
description: >
  Drafts concise, high-impact application and pitch emails based on job postings
  (LinkedIn posts, recruiter emails, job descriptions, or referral requests).
  Extracts requirements, contacts, and salary expectation requests, maps them directly
  to Juan David Posso's profile, and outputs tailored, punchy email drafts in both
  Spanish and English without generic filler. Triggers on: email de postulación,
  redactar correo, crear correo, postularme por correo, application email, pitch email,
  /email
allowed-tools: Read
---

# Application Email Drafter

Drafts ultra-concise, tailored application and pitch emails for jobs found on LinkedIn posts, recruiter messages, or job descriptions.

---

## Philosophy & Style Rules

1. **Keep it short and scannable:** Recruiters and hiring managers spend seconds scanning an email. Avoid dense paragraphs.
2. **Direct self-introduction:** Always introduce Juan David Posso in the opening line (Software Engineer III / former Technical Lead based in Cali, Colombia).
3. **Three high-impact bullets:** Select exactly 3 bullet points that map Juan David's verifiable experience to the post's core requirements:
   - **Frontend / State Management:** React, TypeScript, Redux Toolkit (RTK), Tailwind CSS.
   - **Backend / APIs & Data:** Node.js, Nest.js, RESTful APIs, MySQL/PostgreSQL.
   - **Salesforce (when applicable):** Apex, Lightning Web Components (LWC), Visualforce, APIs/Integrations.
   - **Engineering Culture & Leadership:** Code reviews, performance optimization, mentoring, CI/CD, Git.
4. **No generic filler or clichés:** Never use phrases like *"I would love to connect and discuss how my background can add value to your team"*, *"I am the perfect fit"*, or empty corporate buzzwords. Keep the tone confident, direct, and professional.
5. **Requested details block:** Clearly group:
   - **Salary expectation:** $3,500 USD / month (or $10.000.000 COP depending on contract), included whenever the post asks for it or when relevant for foreign contractor roles.
   - **CV format:** PDF attached.
   - **Links:** LinkedIn and GitHub links formatted clearly.
6. **Bilingual output:** Always provide both the **Spanish version** (preferred for LATAM/Spain) and the **English version** (for international/US teams or posts written in English).

---

## Candidate Profile Reference

Always pull factual details from `.claude/skills/job-application-assistant/01-candidate-profile.md`:

- **Name:** Juan David Posso Rengifo
- **Location:** Cali, Valle del Cauca, Colombia (Remoto)
- **Phone:** +57 3145291839
- **Email:** juandapore3098@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/juandavidposso/
- **GitHub:** https://github.com/juanda3098
- **Current / Recent Seniority:** Software Engineer III / Technical Lead en Veevart
- **Core Stacks:**
  - Frontend: React, TypeScript, Redux / Redux Toolkit, Tailwind CSS, Next.js.
  - Backend: Node.js, Nest.js, MySQL, PostgreSQL, RESTful APIs.
  - Salesforce: Apex, Lightning Web Components (LWC), Aura Components, Visualforce, Flows, Integrations.
  - Practices: Code reviews, architectural design (DDD, Hexagonal), mentoring, performance tuning.
- **Salary Expectations:** $3,500 USD / mes (o $10.000.000 COP según modalidad).

---

## Workflow Steps

### Step 1: Parse the Post
Analyze the user's pasted text or link to extract:
1. **Recipients:** Email addresses mentioned (e.g. `pedro.torres@inallmedia.com`).
2. **Contact Names:** If names are visible in the emails or post (e.g. Pedro, Débora).
3. **Role & Company:** Job title and company name.
4. **Key Technical Triggers:** Frameworks, languages, tools mentioned as strict must-haves.
5. **Special Prompts:** Salary expectation request, portfolio request, code samples.

### Step 2: Map to Candidate Strengths
Select 3 core competencies from Juan David's profile that mirror the requirements.

### Step 3: Generate Drafts
Produce the two drafts (Spanish & English) following the strict concise structure:

```markdown
### Versión en Español / Inglés

**Para:** <emails extraídos>
**Asunto:** Postulación: <Título del Cargo> — Juan David Posso

<Saludo con nombres extraídos o del equipo>

Soy **Juan David Posso**, Ingeniero de Software radicado en Cali, Colombia, con trayectoria como **SWE III y Technical Lead** especializado en <área afín: frontend/full stack/Salesforce>.

Les escribo para postularme al rol de **<Título del Cargo>**:
* **<Área 1>:** <Alineación técnica directa con el post>
* **<Área 2>:** <Alineación backend / datos / integraciones>
* **<Área 3>:** <Prácticas de ingeniería / liderazgo / code reviews>

**Información solicitada / Datos clave:**
* **Aspiración salarial:** $3.500 USD / mes (o $10.000.000 COP). [Omitir si el post no la requiere explícitamente y es primer contacto informal]
* **CV:** Adjunto en PDF.
* **Perfiles:** [LinkedIn](https://www.linkedin.com/in/juandavidposso/) | [GitHub](https://github.com/juanda3098)

Gracias por su tiempo, saludos cordiales.

**Juan David Posso Rengifo**  
+57 3145291839 · Cali, Colombia
```
