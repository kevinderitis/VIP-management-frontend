# VolunteerFlow Hostel

Frontend conceptual y funcional para gestionar voluntarios, tareas, packs de temporada y recompensas en un hostel. Esta primera etapa usa datos mock en memoria con un store local reactivo, pero la estructura ya está pensada para conectar un backend en Node.js sin reescribir la app.

## Stack

- React + Vite + TypeScript
- React Router
- Zustand
- Tailwind CSS
- Preparación visual para PWA con `manifest.webmanifest`

## Cómo correrlo

```bash
cd frontend
npm install
npm run dev
```

Build de producción:

```bash
cd frontend
npm run build
```

Lint:

```bash
cd frontend
npm run lint
```

Nota: en este entorno Vite muestra un warning porque recomienda Node `20.19+`. Aun así, `build` compila correctamente con Node `20.14.0`. Si querés evitar el warning, actualizá Node.

## Estructura

```text
src/
  components/
    admin/
    common/
    volunteer/
  hooks/
  layouts/
  mock/
  pages/
    admin/
    auth/
    volunteer/
  routes/
  store/
  types/
  utils/
public/
  icons/
  manifest.webmanifest
```

## Qué incluye

- Login demo con selector de usuario mock
- Layout desktop/backoffice para admin
- Layout mobile-first tipo PWA para voluntarios
- Dashboard admin con métricas y actividad
- Gestión de tareas con creación, edición, publicación y desactivación
- Packs de tareas reutilizables
- Vista dedicada de asignación de grupos/temporadas
- Gestión de voluntarios
- Gestión de premios y visualización de canjes
- Monitor general del sistema
- Dashboard voluntario, tareas disponibles, mis tareas, recompensas y perfil
- Publicación automática de tareas programadas con simulación local de tiempo real
- Toasts, badges, empty states, progreso y ranking suave

## Dónde conectar backend después

- [`src/store/app-store.ts`](./src/store/app-store.ts): hoy contiene acciones locales de negocio. Es el punto principal para reemplazar mocks por llamadas REST y eventos WebSocket.
- [`src/hooks/useRealtimeSimulation.ts`](./src/hooks/useRealtimeSimulation.ts): hoy simula publicaciones automáticas. Más adelante puede reemplazarse por polling o suscripción real.
- [`src/mock/data.ts`](./src/mock/data.ts): datos semilla para demo. Luego puede quedar solo para fixtures de desarrollo.
- Modales y páginas admin/voluntario: ya envían y consumen objetos con forma estable, listos para mapear a DTOs del backend.

## Siguiente paso sugerido

Mantener el store como capa de adaptación temporal y, cuando aparezca el backend Node.js, mover cada acción a un módulo de `services/api` o `lib/api-client` sin tocar la UI ni la estructura de rutas.
