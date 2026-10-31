# TutoríasGT — Marketplace de Tutorías

TutoríasGT es una plataforma web que conecta a estudiantes con tutores. Los estudiantes pueden buscar tutores por materia, modalidad, precio, calificación y distancia, contratar un plan de clases y coordinar con el tutor por chat en tiempo real. Los tutores publican sus ofertas, definen su horario semanal y aprueban o rechazan las solicitudes que reciben.

La plataforma cuenta con un panel de administración para manejar el catálogo de categorías, aprobar a los tutores nuevos, atender denuncias, suspender cuentas, resolver apelaciones y consultar reportes de uso.

🔗 **Proyecto publicado:** https://marketplace-tutorias.netlify.app/

## Funcionalidades principales

- Inicio de sesión con Google y perfiles por rol: estudiante, tutor y administrador.
- Búsqueda de tutores con filtros por categoría, modalidad, precio, calificación y distancia en mapa.
- Contratación de planes de clases con presue el costo de traslado a domicilio.
- Calendario de sesiones con vista por mes, semana y día.
- Reseñas y calificaciones de las clases cum
- Chat en tiempo real entre estudiante y tutor.
- Denuncias, suspensión de cuentas y apelaci
- Reportes para el administrador: ranking de tutores, demanda por categoría y tutorías por mes.

## Tecnologías utilizadas

### Frontend
- React con TypeScript, usando Vite
- React Router para la navegación
- Sass para los estilos
- Axios para consumir la API
- Socket.IO Client para el chat en tiempo re
- Google OAuth (`@react-oauth/google`) para el inicio de sesión
- Leaflet y React Leaflet para los mapas
- React Big Calendar y date-fns para el calendario
- Recharts para las gráficas de reportes

### Backend
- Node.js con Express y TypeScript
- Prisma ORM con base de datos PostgreSQL
- JSON Web Tokens (JWT) para la autenticación
- Google Auth Library para validar el inicio
- Socket.IO para el chat en tiempo real
- Zod para validar los datos
- Helmet, CORS y Morgan para seguridad y registro de peticiones

### Despliegue y herramientas
- Netlify para el frontend
- Render para el backend y la base de datos PostgreSQL
- Postman para las pruebas de la API
- Git y GitHub para el control de versiones

## Documentación

En este repositorio se incluyen dos manuales:

- **Manual técnico:** explica cómo está construido el sistema: arquitectura, base de datos, API, configuración y
despliegue. Está dirigido a desarrolladores.
- **Manual de usuario:** explica paso a paso, con capturas de pantalla, cómo usar la plataforma como estudiante, tutor
y administrador.

## Estructura del repositorio

```
marketplace-tutorias/
├── backend/    API REST, Socket.IO y esquem
├── frontend/   Aplicación web en React
└── docs/       Manual técnico y manual de usuario
```

## Integrantes

| Nombre | Carné |
|---|---|
| Edilson Enrique García Villeda | 9490-23-2637 |
| Damaris Luz Marié Cabrera Carino | 9490-23-3042 |
