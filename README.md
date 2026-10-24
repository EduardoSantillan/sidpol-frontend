# Plataforma SIDPOL – Frontend

Este es el frontend de mi tesis: una plataforma para ver qué tan bien pronostican las estrategias (Local, Global, naïve-1 y naïve estacional) las denuncias de robo y hurto en los 43 distritos de Lima. Está hecho con React + TypeScript + Vite.

Por ahora **no tiene backend**. Los datos que se ven son de ejemplo y se generan en el navegador, así que sirve para ver y probar cómo se comporta cada pantalla, no para sacar resultados reales.

## Cómo correrlo

Necesitas tener Node.js instalado (yo uso la versión 24).

```bash
npm install
npm run dev
```

Eso levanta la app en `http://localhost:5173`.

Si solo quieres revisar que compile bien:

```bash
npm run build
```

## Qué hay adentro

Son 5 pantallas, más el login:

| Pantalla | Qué hace | Quién la ve |
|---|---|---|
| P1 Resumen y Comparación | Resumen por distrito y tabla para comparar | Usuario, Analista |
| P2 Resultados Individuales | Serie histórica de un distrito contra los pronósticos | Usuario, Analista |
| P3 Estrategias y Trazabilidad | Compara Local vs Global y muestra de dónde sale cada valor | Analista |
| P4 Versiones de datos | Registra versiones del archivo SIDPOL y revisa su integridad | Administrador |
| P5 Ejecuciones | Inicia y sigue las ejecuciones del experimento | Analista |

## La barra "Prototipo"

Arriba de todo hay una barra morada. La puse para poder cambiar el **rol** (Usuario, Analista o Administrador) y el **estado de la pantalla** (cargando, error, vacío, etc.) sin necesitar un backend. También tiene un botón para mostrar la especificación UX de cada pantalla. Cuando conecte el backend esa barra se va.

## Cómo está organizado

```
src/
  lib/data.ts       datos de ejemplo y cálculos (aquí se cambiará por la API)
  lib/store.tsx     estado de la app
  components/       gráfico y piezas compartidas
  screens/          una pantalla por archivo (P1 a P5)
  App.tsx           estructura general, login y modales
  styles.css        estilos
```

## Lo que falta

- Conectar el backend. Todo lo que hoy sale de `src/lib/data.ts` tiene que venir de la API.
- Un login de verdad. Ahora cualquier clic en "Iniciar sesión" entra.

> Los valores que muestra son denuncias registradas en SIDPOL, no criminalidad real, y ningún distrito se califica por riesgo o prioridad.
