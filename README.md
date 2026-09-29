# Gamio 🎮 — Ecosistema Social Gaming Unificado

![Astro](https://img.shields.io/badge/Astro-5.x-ff5d01?style=for-the-badge&logo=astro&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)

Este repositorio contiene la aplicación web principal y la documentación académica completa del **Trabajo de Fin de Grado (TFG) Gamio**, un ecosistema multiplataforma unificado para la búsqueda de compañeros de equipo (matchmaking LFG), mensajería en tiempo real y gamificación con recompensas.

---

## 🔗 Enlaces en Producción y Repositorios

* 🌐 **Sitio Web Principal (App Astro SSR):** [https://gamio-tfg.vercel.app](https://gamio-tfg.vercel.app)
* 💼 **Landing Page Comercial B2B:** [https://gamio-landing-static.vercel.app](https://gamio-landing-static.vercel.app)
* 📂 **Repositorio Web (Astro):** [https://github.com/ERCOMEPIPA/GamioTFG](https://github.com/ERCOMEPIPA/GamioTFG)
* 📱 **Repositorio Móvil (Flutter):** [https://github.com/ERCOMEPIPA/gamioFlutter](https://github.com/ERCOMEPIPA/gamioFlutter)

---

## 📚 Documentación del TFG

Toda la documentación académica y técnica del proyecto se encuentra en la carpeta [`Documentacion/`](./Documentacion/):

* 📄 **[`Documentacion/documentacion_gamio_editorial.pdf`](./Documentacion/documentacion_gamio_editorial.pdf)** — Memoria oficial en PDF con maquetación editorial completa.
* 📝 **[`Documentacion/documentacion_gamio.md`](./Documentacion/documentacion_gamio.md)** — Memoria técnica completa en formato Markdown.
* 🌐 **[`Documentacion/documentacion_gamio.html`](./Documentacion/documentacion_gamio.html)** — Versión web interactiva de la memoria.
* 📄 **[`Documentacion/documentacion_gamio.docx`](./Documentacion/documentacion_gamio.docx)** — Archivo editable en formato Microsoft Word.

---

## 📁 Estructura del Proyecto Web (`GamioWEB`)

```text
GamioWEB/
├── Documentacion/                 # 📚 Memoria académica del TFG (PDF, MD, HTML, DOCX)
├── gamio-landing/                 # 💼 Landing Page estática independiente (B2B)
├── public/                        # 🖼️ Archivos estáticos, imágenes de juegos y assets
├── src/
│   ├── components/                # 🧩 Componentes UI y vistas principales
│   ├── layouts/                   # 📐 Layouts de la aplicación (MainLayout)
│   ├── lib/                       # 🛠️ Servicios Supabase, Email, GameStats y Helpers
│   ├── pages/                     # 🚀 Rutas SSR de Astro y Endpoints API
│   └── styles/                    # 🎨 Estilos CSS globales y de la memoria
├── *.sql                          # 🗄️ Scripts de base de datos Supabase (RLS, Triggers, Tables)
├── astro.config.mjs               # ⚙️ Configuración del framework Astro
└── package.json                   # 📦 Dependencias y scripts
```

---

## 🛠️ Tecnologías Utilizadas

* **Framework Web:** [Astro](https://astro.build/) (Server-Side Rendering)
* **Lenguaje:** TypeScript / JavaScript (ES6+)
* **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL en tiempo real, RLS, Webhooks, Storage)
* **Estilos:** Vanilla CSS con variables personalizadas y diseño adaptativo.
* **Email & Notificaciones:** Resend / Nodemailer integrations.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### 1. Requisitos Previos
* Node.js v18+ 
* npm o pnpm

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz de `GamioWEB/` tomando como base `.env.example`:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### 3. Instalación e Inicio
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo local
npm run dev
```

El proyecto estará disponible en `http://localhost:4321`.

### 4. Compilación para Producción
```bash
# Generar la build SSR de producción
npm run build

# Previsualizar la build de producción
npm run preview
```

---

## 🤝 Autor y Licencia

Desarrollado como Proyecto de Fin de Grado (TFG) por **ERCOMEPIPA**.
Todos los derechos reservados © 2026.
