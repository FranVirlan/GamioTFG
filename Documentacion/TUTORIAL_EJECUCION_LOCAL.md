# 🚀 Tutorial: Cómo ejecutar Gamio en local

Este tutorial explica paso a paso cómo poner en marcha el ecosistema **Gamio** en un ordenador local para evaluación o desarrollo. El proyecto se compone de dos aplicaciones independientes:

| Módulo | Tecnología | Carpeta |
|---|---|---|
| **App Web** | Astro + TypeScript + Supabase | `GamioWEB/` |
| **App Móvil** | Flutter + Dart + Supabase | `GamioMOBILE/` |

> [!NOTE]
> Ambas aplicaciones se conectan a la misma base de datos **Supabase** ya configurada en producción. Solo necesitas copiar las claves de entorno para que funcionen. No es necesario instalar ni configurar ninguna base de datos localmente.

---

## 📋 Requisitos previos

Antes de empezar, asegúrate de tener instalado lo siguiente:

### Para la App Web
| Herramienta | Versión mínima | Enlace de descarga |
|---|---|---|
| **Node.js** | v22.12.0 o superior | [nodejs.org](https://nodejs.org) |
| **npm** | Incluido con Node.js | — |

Para verificar que Node.js está instalado, abre una terminal y ejecuta:
```bash
node --version
npm --version
```

### Para la App Móvil
| Herramienta | Versión mínima | Enlace de descarga |
|---|---|---|
| **Flutter SDK** | v3.x o superior | [flutter.dev](https://docs.flutter.dev/get-started/install) |
| **Dart SDK** | ^3.10.8 (incluido con Flutter) | — |
| **Android Studio** o **Xcode** | Última versión estable | Para emuladores |

Para verificar que Flutter está instalado correctamente:
```bash
flutter doctor
```
> [!TIP]
> El comando `flutter doctor` lista los componentes instalados y te avisa si falta algo. Asegúrate de que no haya errores críticos antes de continuar.

---

## 🌐 Parte 1 — App Web (Astro)

### Paso 1: Acceder a la carpeta del proyecto web

Abre una terminal y navega hasta la carpeta `GamioWEB`:

```bash
cd GamioWEB
```

### Paso 2: Configurar las variables de entorno

La aplicación necesita las credenciales de Supabase para conectarse a la base de datos. Copia el fichero de ejemplo y rellena los valores:

```bash
# En Windows (PowerShell)
Copy-Item .env.example .env

# En macOS / Linux
cp .env.example .env
```

Abre el fichero `.env` recién creado con cualquier editor de texto y reemplaza los valores de ejemplo con las claves reales del proyecto:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contrasena-de-aplicacion
```

> [!IMPORTANT]
> Las claves de Supabase (`PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`) son las del proyecto en producción. Puedes encontrarlas en el panel de Supabase → **Project Settings → API**. Sin estas claves, la aplicación no podrá conectarse a la base de datos.

> [!CAUTION]
> El fichero `.env` contiene información sensible. **Nunca lo subas a un repositorio público.** Ya está incluido en el `.gitignore` del proyecto.

### Paso 3: Instalar las dependencias

```bash
npm install
```

Este comando descarga todos los paquetes necesarios (Astro, React, Tailwind CSS, Supabase, etc.) en la carpeta `node_modules/`. Puede tardar uno o dos minutos la primera vez.

### Paso 4: Arrancar el servidor de desarrollo

```bash
npm run dev
```

La aplicación arrancará y verás una salida similar a esta en la terminal:

```
 astro  v6.x.x ready in Xms

┃ Local    http://localhost:4321/
┃ Network  use --host to expose
```

### Paso 5: Abrir la aplicación en el navegador

Abre tu navegador y accede a:

```
http://localhost:4321
```

¡La aplicación está funcionando en local! 🎉

---

## 📱 Parte 2 — App Móvil (Flutter)

### Paso 1: Acceder a la carpeta del proyecto móvil

Abre una **nueva terminal** (la anterior puede seguir ejecutando el servidor web) y navega a la carpeta `GamioMOBILE`:

```bash
cd GamioMOBILE
```

### Paso 2: Configurar las variables de entorno

Al igual que en la web, copia el fichero de ejemplo:

```bash
# En Windows (PowerShell)
Copy-Item .env.example .env

# En macOS / Linux
cp .env.example .env
```

Abre el fichero `.env` y rellena las claves de Supabase:

```env
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

### Paso 3: Instalar las dependencias de Flutter

```bash
flutter pub get
```

Este comando descarga todos los paquetes de Dart/Flutter necesarios (Supabase Flutter SDK, Google Fonts, etc.).

### Paso 4: Seleccionar un dispositivo o emulador

Comprueba qué dispositivos tienes disponibles:

```bash
flutter devices
```

Obtendrás una lista similar a:

```
3 connected devices:

sdk gphone64 x86 64 (mobile) • emulator-5554 • android-x64    • Android 14
Chrome (web)                  • chrome        • web-javascript  • Google Chrome 120
Windows (desktop)             • windows       • windows-x64     • Windows 11
```

### Paso 5: Arrancar la aplicación

Para lanzar la app en el emulador o dispositivo por defecto:

```bash
flutter run
```

Si quieres elegir un dispositivo específico:

```bash
flutter run -d emulator-5554   # Android
flutter run -d chrome          # Navegador web
flutter run -d windows         # Escritorio Windows
```

> [!TIP]
> Para obtener la mejor experiencia, usa un emulador de Android (disponible desde Android Studio → AVD Manager) o un dispositivo físico conectado por USB con la depuración USB activada.

---

## ⚡ Resumen rápido (Cheat Sheet)

```bash
# --- APP WEB ---
cd GamioWEB
cp .env.example .env   # Rellenar con las claves de Supabase
npm install
npm run dev            # → http://localhost:4321

# --- APP MÓVIL ---
cd GamioMOBILE
cp .env.example .env   # Rellenar con las claves de Supabase
flutter pub get
flutter run
```

---

## 🛠️ Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `Error: Cannot find module '...'` | Dependencias no instaladas | Ejecuta `npm install` en `GamioWEB/` |
| La web carga pero no hay datos | Variables de entorno incorrectas | Comprueba el fichero `.env` con las claves de Supabase |
| `flutter: command not found` | Flutter no está en el PATH | Sigue la guía oficial de instalación de Flutter |
| `flutter doctor` muestra errores | Herramientas de Android/iOS incompletas | Instala Android Studio y acepta las licencias con `flutter doctor --android-licenses` |
| Puerto 4321 ya en uso | Otro proceso usa ese puerto | Cambia el puerto: `npm run dev -- --port 3000` |

---

## 🔗 Referencias

- 📖 Documentación de Astro: [docs.astro.build](https://docs.astro.build)
- 📖 Documentación de Flutter: [docs.flutter.dev](https://docs.flutter.dev)
- 📖 Documentación de Supabase: [supabase.com/docs](https://supabase.com/docs)
- 🌐 App en producción: [https://gamio-tfg.vercel.app](https://gamio-tfg.vercel.app)
