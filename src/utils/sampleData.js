import w0 from '../../sample-data/semana-2026-09-28.csv?url'
import w1 from '../../sample-data/semana-2026-10-05.csv?url'
import w2 from '../../sample-data/semana-2026-10-12.xlsx?url'

// Datos de ejemplo (inventados) que se empaquetan con la web para poder probar el panel sin archivos propios.
const SAMPLES = [
  { name: 'semana-2026-09-28.csv', url: w0 },
  { name: 'semana-2026-10-05.csv', url: w1 },
  { name: 'semana-2026-10-12.xlsx', url: w2 },
]

export async function fetchSampleFiles() {
  return Promise.all(
    SAMPLES.map(async ({ name, url }) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`No se pudo cargar ${name}`)
      return new File([await res.blob()], name)
    }),
  )
}
