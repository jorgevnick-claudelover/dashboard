# Panel semanal · Mudanzas Trébol

SPA de solo lectura para la dirección de Mudanzas Trébol (React + Vite + Tailwind). Sube las exportaciones semanales (CSV/Excel) y calcula volumen total, importe medio, mejores/peores días, comparativa con la semana anterior y acumulado del mes. Todo vive en `localStorage`: sin APIs ni base de datos.

## Cómo arrancar

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 16 pruebas: cálculos exactos, parseo, antiduplicados, comparativa
npm run build    # genera dist/ (Vercel: build `npm run build`, salida `dist`)
```

Contraseña de acceso: `Trebol2026`.

## Dónde está cada cosa

| Carpeta | Contenido |
|---|---|
| `src/utils/` | Lógica pura, sin React: `money` (céntimos enteros + decimal.js), `dates`, `normalize`, `columns`, `parseFile`, `dedupe`, `metrics`, `storage`, `sampleData` |
| `src/hooks/` | `useAuth` (sesión simulada), `useRecords` (datos + persistencia) |
| `src/components/` | UI. `ui/` son primitivas sobrias al estilo shadcn |
| `sample-data/` | 3 semanas de ejemplo con suciedad deliberada + `hoja-de-control.csv` con los totales exactos esperados |
| `scripts/` | `npm run sample-data` regenera los archivos de ejemplo |

## Qué está simulado

- **Login:** la contraseña (`Trebol2026`) está en el código del navegador (`src/hooks/useAuth.js`). Filtra visitas casuales; **no es seguridad real**. La sesión dura 12 h.
- **"Base de datos":** `localStorage` del navegador. Los datos no se comparten entre navegadores, equipos ni dominios.
- **No hay** correos, pagos, WhatsApp, TPV ni previsiones: no se conecta con ningún servicio externo.

## Datos de ejemplo y cómo reiniciarlos

- En el panel, **Cargar datos → "o cargar los datos de ejemplo"** importa 3 semanas inventadas (28 sep – 18 oct 2026). Deben dar 49.474,09 · 40.094,29 · 36.411,13 (ver `sample-data/hoja-de-control.csv`).
- **Reiniciar:** botón **Vaciar todo** en "Archivos cargados", o borrar el `localStorage` (DevTools → Application → Local Storage → clic derecho → Clear, o ejecutar `localStorage.clear()` en la consola) y recargar.

## Decisiones de cálculo

- **Volumen total** = suma de importes del periodo; se muestra aparte el nº de operaciones. **Importe medio** = volumen ÷ operaciones. Todo en céntimos enteros; medias y % con `decimal.js` (redondeo half-up a 2 decimales).
- **Semanas** de lunes a domingo. Por defecto: última semana cargada vs. la semana natural inmediatamente anterior.
- **Mes y MTD:** del día 1 al último día con datos, vs. los mismos días del mes anterior.
- **Mejor/peor día:** total diario más alto/bajo entre los días con operaciones.
- **Antiduplicados:** huella SHA-256 del contenido (no del nombre ni del formato) + clave por operación. Un archivo ya cargado se bloquea; uno solapado importa solo las filas nuevas.
- **Filas descartadas** (sin fecha o importe válido, p. ej. la línea TOTAL) se listan antes de importar.
- **PDF:** Imprimir/PDF saca solo el resumen, en una hoja A4 vertical (sin botones, menús ni tabla de detalle).
- **Columnas:** se detectan por nombre (fecha, importe, cliente, camión, nº de operación) y se pueden corregir antes de importar.
