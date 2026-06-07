# Despliegue de la Landing Page Estática de Gamio en Vercel

Esta carpeta contiene la **landing page estática, ultra-ligera e independiente** de Gamio (`index.html`), diseñada para "vender" el ecosistema a inversores o empresas sin mezclarla con el código o funcionamiento de la aplicación real.

Está construida de forma autónoma usando:
- **Tailwind CSS Play CDN** para estilos y diseño responsivo.
- **Supabase JS CDN** y tus claves públicas configuradas de forma cliente, lo que mantiene el **contador de jugadores activos en tiempo real** funcionando por WebSockets.
- Enlaces y botones de acción configurados para redirigir a tu aplicación real desplegada.

---

## 🚀 Cómo subirla a Vercel en 30 segundos (Sin repositorios extras)

Puedes subir esta landing de forma rápida e independiente utilizando la **CLI de Vercel** desde tu terminal local:

1. **Abre una terminal** en esta carpeta (`gamio-landing`).
2. **Inicia sesión** en Vercel (si no lo has hecho):
   ```bash
   npx vercel login
   ```
3. **Despliega la landing**:
   ```bash
   npx vercel
   ```
4. **Responde a las preguntas de la consola**:
   - *Set up and deploy?* -> `yes`
   - *Which scope?* -> Elige tu cuenta personal.
   - *Link to existing project?* -> `no` (ya que es un proyecto nuevo e independiente de la landing).
   - *What's your project's name?* -> Escribe `gamio-landing` o el nombre que prefieras.
   - *In which directory is your code located?* -> Presiona Enter (`./`).
   - *Want to modify settings?* -> `no` (Vercel detectará que es un sitio HTML estático y lo subirá inmediatamente).

¡Listo! Vercel te dará una URL pública tipo `gamio-landing.vercel.app` que cargará al instante y será 100% inmune a errores de servidor o caídas (500).

---

## 🔗 Personalización de Enlaces
Si tu aplicación real utiliza una URL diferente a `https://gamio-tfg.vercel.app`, puedes cambiarla fácilmente:
1. Abre el archivo `index.html`.
2. Busca los atributos `href="..."` de los botones de **Acceder** y **Registrarse**.
3. Reemplázalos por la URL del dominio real de tu aplicación.
