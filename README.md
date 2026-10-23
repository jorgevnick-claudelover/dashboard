# Panel semanal · Mudanzas Trébol

SPA de solo lectura (React + Vite + Tailwind). Todo vive en `localStorage`; sin APIs ni base de datos.

```bash
npm install
npm run dev      # http://localhost:5173  ·  contraseña: Trebol2026
npm test         # cálculos, parseo, antiduplicados (16 pruebas)
npm run build
```

## Estructura
- `src/utils/` — lógica pura, sin React: `money` (céntimos enteros + decimal.js), `dates`, `normalize`, `columns`, `parseFile`, `dedupe`, `metrics`, `storage`.
- `src/hooks/` — `useAuth`, `useRecords` (persistencia).
- `src/components/` — UI (`ui/` = primitivas estilo shadcn).
- `sample-data/` — 3 semanas de ejemplo con suciedad deliberada + `hoja-de-control.csv` con los totales exactos. Regenerar: `npm run sample-data`.

## Decisiones
- **Volumen total** = suma de importes del periodo (volumen de negocio); se muestra aparte el nº de operaciones. **Importe medio** = volumen ÷ operaciones.
- **Semanas** de lunes a domingo. Por defecto: última semana cargada vs. la semana natural inmediatamente anterior.
- **Mes** y **MTD**: del día 1 al último día con datos del mes del último dato cargado, vs. los mismos días del mes anterior.
- **Mejor/peor día**: total diario más alto/bajo entre los días con operaciones.
- **Antiduplicados**: huella SHA-256 del contenido (no del nombre ni del formato) + clave por operación. Un archivo ya cargado se bloquea; uno solapado importa solo las filas nuevas.
- **Filas descartadas** (sin fecha o importe válido, p. ej. la línea TOTAL) se listan antes de importar: nada se pierde en silencio.
- **PDF**: el botón Imprimir/PDF imprime solo el resumen (sin tabla de detalle, botones ni menús) en A4 vertical.
- La contraseña va en el código del navegador: filtra visitas casuales, no es seguridad real.
