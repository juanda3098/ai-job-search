# /email - Redactor de correos cortos de postulación

Genera correos de postulación y primeros contactos ultra concisos, directos y personalizados basados en un post de empleo (LinkedIn, email, Twitter/X o portal de empleo).

---

## Instrucciones de Ejecución

1. **Entrada del usuario:**
   El usuario proporcionará el texto de una publicación, mensaje o enlace de una oferta de empleo. Si solo ejecutó `/email` sin contenido adicional, solicita amablemente:
   > *"Por favor, pega el texto de la vacante, publicación o mensaje de LinkedIn para redactar el correo."*

2. **Cargar perfil del candidato:**
   Lee los datos clave desde `.claude/skills/job-application-assistant/01-candidate-profile.md`:
   - Nombre: Juan David Posso Rengifo
   - Ubicación: Cali, Colombia
   - Contacto: juandapore3098@gmail.com | +57 3145291839
   - Enlaces: LinkedIn (https://www.linkedin.com/in/juandavidposso/) y GitHub (https://github.com/juanda3098)
   - Roles recientes: SWE III y Technical Lead en Veevart
   - Stack principal: React, TypeScript, Redux Toolkit, Node.js, Nest.js, MySQL, Salesforce (Apex, LWC, Aura)
   - Aspiración salarial: $3,500 USD / mes (o $10.000.000 COP)

3. **Reglas de redacción:**
   - **Presentación breve:** Juan David Posso, SWE III / ex Tech Lead desde Cali, Colombia.
   - **Cuerpo con 3 viñetas técnicas:** Alineación directa y concreta con las palabras clave requeridas en el post.
   - **Datos solicitados:** Salario (si lo piden o es rol contractor), CV adjunto en PDF y enlaces a perfiles.
   - **Sin frases cliché:** Cero relleno como "I would love to connect and discuss how my background can add value...".
   - **Despedida establecida:** Siempre cerrar con *"Gracias por su tiempo, saludos cordiales"* (o *"Thank you for your time, best regards"* en inglés).
   - **Salida bilingüe:** Siempre entrega la versión en Español y la versión en Inglés.
