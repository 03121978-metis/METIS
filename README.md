# METIS · Planificador Passivhaus

Beta de herramienta web para diseño de viviendas Passivhaus en entramado ligero. Dibuja la planta, calcula la calificación energética y genera presupuesto + ficha técnica PDF.

## Ejecutar en local

Necesitas Node.js 18 o superior. Si no lo tienes: https://nodejs.org

```bash
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

## Desplegar en Vercel (gratis, 2 minutos)

1. Crea cuenta en https://vercel.com con tu GitHub
2. Sube este proyecto a un repo nuevo de GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial METIS beta"
   # crea repo en github.com/new y copia la URL
   git remote add origin https://github.com/TU_USUARIO/metis.git
   git push -u origin main
   ```
3. En Vercel: "Add New..." → "Project" → importa el repo
4. Vercel detecta Vite automáticamente. Click "Deploy"
5. En 30 segundos tienes URL pública tipo `metis-xxx.vercel.app`
6. Cada vez que empujes cambios, se actualiza solo

## Desplegar en Netlify (alternativa)

1. Cuenta en https://netlify.com
2. "Add new site" → "Import from Git" → selecciona el repo
3. Build command: `npm run build` · Publish directory: `dist`
4. Deploy

## Build de producción

```bash
npm run build
# genera carpeta dist/ lista para subir a cualquier servidor estático
```

## Compartir con testers

- URL de Vercel → envía a quien quieras. Funciona en móvil, tablet y ordenador.
- Los datos se guardan localmente en cada dispositivo (localStorage).
- Los proyectos se pueden exportar como JSON y compartir por email/WhatsApp.

## Estructura

```
metis/
├── src/
│   ├── App.jsx          ← toda la lógica de la app
│   └── main.jsx         ← punto de entrada React
├── public/
│   └── favicon.svg
├── index.html
├── package.json
└── vite.config.js
```

Todo el código está en `src/App.jsx`. No hay backend — funciona 100% en el navegador del cliente.

## Próximos pasos para beta real

- [ ] Analítica: Plausible o Google Analytics 4
- [ ] Formulario de feedback integrado (Supabase o Google Form)
- [ ] Captura de leads en el PDF (envía presupuesto al email del estudio)
- [ ] Backend para guardar proyectos en nube (Supabase)
- [ ] Integración con bot de Telegram para notificaciones
- [ ] Términos legales y política de cookies (GDPR)
- [ ] PWA: instalable como app en móvil

## Contacto

David — entramado ligero Passivhaus · Madrid
