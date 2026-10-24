/* Datos ilustrativos y cálculos del prototipo SIDPOL (sin backend). */

export type Estrategia = "local" | "global" | "n1" | "ns";
export type Metrica = "mase" | "mae" | "rmse";
export type Vista = "general" | "pre" | "post";
export type Target = "Robo" | "Hurto";
export type Rol = "usuario" | "analista" | "admin";
export type Pantalla = "p1" | "p2" | "p3" | "p4" | "p5";

export const DISTRITOS = ["Ancón","Ate","Barranco","Breña","Carabayllo","Chaclacayo","Chorrillos","Cieneguilla","Comas","El Agustino","Independencia","Jesús María","La Molina","La Victoria","Lima","Lince","Los Olivos","Lurigancho","Lurín","Magdalena del Mar","Miraflores","Pachacámac","Pucusana","Pueblo Libre","Puente Piedra","Punta Hermosa","Punta Negra","Rímac","San Bartolo","San Borja","San Isidro","San Juan de Lurigancho","San Juan de Miraflores","San Luis","San Martín de Porres","San Miguel","Santa Anita","Santa María del Mar","Santa Rosa","Santiago de Surco","Surquillo","Villa El Salvador","Villa María del Triunfo"];
export const BAJOS = ["Santa María del Mar","Punta Negra","Pucusana","San Bartolo","Punta Hermosa","Santa Rosa"];
export const EST: [Estrategia, string][] = [["local","Local"],["global","Global"],["n1","naïve-1"],["ns","naïve estacional"]];
export const ESTN = Object.fromEntries(EST) as Record<Estrategia, string>;

export const N = 103;
export const BREAK = 82;
export const O0 = 60;
export const O1 = 102;
export const H = 1;

const MES = ["ene","feb","mar","abr","may","jun","jul","ago","set","oct","nov","dic"];
export const labL = (i: number) => MES[i % 12] + " " + (2018 + Math.floor(i / 12));
export const fmt = (n: number, d = 0) =>
  n.toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d });
export const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, "_");

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cacheSerie = new Map<string, number[]>();
export function serie(d: string, tg: Target): number[] {
  const k = d + tg;
  const hit = cacheSerie.get(k);
  if (hit) return hit;
  const r = rng(k);
  const low = BAJOS.includes(d);
  const base = low
    ? (tg === "Robo" ? 0.5 : 1.5) + r() * 2.5
    : (tg === "Robo" ? 70 : 90) + r() * (tg === "Robo" ? 430 : 520);
  const ratio = tg === "Robo" ? 0.32 + r() * 0.22 : 0.72 + r() * 0.18;
  const tr = (r() - 0.4) * 0.004;
  const y: number[] = [];
  for (let i = 0; i < N; i++) {
    let v = base * (1 + tr * i) * (1 + 0.08 * Math.sin(((i % 12) / 12) * 2 * Math.PI + 1)) * (1 + (r() - 0.5) * 0.18);
    if (i === 26 || i === 27) v *= 0.35;
    if (i >= 28 && i <= 31) v *= 0.75;
    if (i >= BREAK) v *= ratio;
    v = low ? Math.max(0, Math.round(v + (r() - 0.55) * 2.2)) : Math.round(v);
    if (d === "Santa María del Mar" && tg === "Robo") v = i === 71 ? 1 : 0;
    y.push(v);
  }
  cacheSerie.set(k, y);
  return y;
}

function pron(d: string, tg: Target, s: Estrategia, o: number, h: number): number {
  const y = serie(d, tg);
  const t = o + h;
  const r = rng(d + tg + s + o + "_" + h);
  const lvl = (y[o] + y[o - 1] + y[o - 2]) / 3;
  const m12 = y.slice(o - 11, o + 1).reduce((a, b) => a + b, 0) / 12 || 1;
  const seas = y[t - 12] * (lvl / m12);
  let v: number;
  if (s === "n1") v = y[o];
  else if (s === "ns") v = y[t - 12];
  else if (s === "local") v = (0.55 * lvl + 0.45 * seas) * (1 + (r() - 0.5) * 0.07);
  else v = (0.62 * lvl + 0.38 * seas) * (1 + (r() - 0.5) * 0.06);
  return Math.max(0, Math.round(v * 10) / 10);
}

export interface Resultado extends Record<Estrategia, number> {
  o: number;
  h: number;
  t: number;
  obs: number | null;
  reg: "pre" | "post";
}

const cacheRes = new Map<string, Resultado[]>();
export function resultados(d: string, tg: Target): Resultado[] {
  const k = d + tg;
  const hit = cacheRes.get(k);
  if (hit) return hit;
  const y = serie(d, tg);
  const out: Resultado[] = [];
  for (let o = O0; o <= O1; o++)
    for (let h = 1; h <= H; h++) {
      const t = o + h;
      const row = { o, h, t, obs: t < N ? y[t] : null, reg: t >= BREAK ? "post" : "pre" } as Resultado;
      EST.forEach(([s]) => (row[s] = pron(d, tg, s, o, h)));
      out.push(row);
    }
  cacheRes.set(k, out);
  return out;
}

export interface MetricaEst {
  mae: number;
  rmse: number;
  mase: number | null;
}
export type Metricas = Record<Estrategia, MetricaEst>;

const cacheMet = new Map<string, Metricas>();
export function metr(d: string, tg: Target, per: Vista): Metricas {
  const k = d + tg + per;
  const hit = cacheMet.get(k);
  if (hit) return hit;
  const y = serie(d, tg);
  let sc = 0;
  for (let i = 1; i < O0; i++) sc += Math.abs(y[i] - y[i - 1]);
  sc /= O0 - 1;
  const rs = resultados(d, tg).filter((r) => r.obs != null && (per === "general" || r.reg === per));
  const m = {} as Metricas;
  EST.forEach(([s]) => {
    const mae = rs.reduce((a, r) => a + Math.abs(r[s] - (r.obs as number)), 0) / rs.length;
    const rmse = Math.sqrt(rs.reduce((a, r) => a + (r[s] - (r.obs as number)) ** 2, 0) / rs.length);
    m[s] = { mae, rmse, mase: sc > 0 ? mae / sc : null };
  });
  cacheMet.set(k, m);
  return m;
}

/* ---- Ejecuciones, versiones y configuración ---- */
export interface Ejecucion {
  id: string;
  tg: Target;
  ver: string;
  st: "ok" | "er" | "run";
  ini: string;
  dur: string;
  por: string;
  msg?: string;
}
export const EJEC: Ejecucion[] = [
  { id: "EJ-0014", tg: "Hurto", ver: "SIDPOL-2026-07 · v1", st: "ok", ini: "28/09/2026 09:32", dur: "14 min", por: "M. Barzola" },
  { id: "EJ-0013", tg: "Robo", ver: "SIDPOL-2026-07 · v1", st: "ok", ini: "28/09/2026 09:10", dur: "13 min", por: "M. Barzola" },
  { id: "EJ-0012", tg: "Robo", ver: "SIDPOL-2026-07 · v1", st: "er", ini: "27/09/2026 18:44", dur: "6 min", por: "M. Barzola", msg: "Etapa 6 (Ajuste e inferencia): el Motor Global terminó con error de memoria al ajustar el origen 2025-11." },
  { id: "EJ-0011", tg: "Hurto", ver: "SIDPOL-2026-06 · v1", st: "ok", ini: "03/09/2026 17:52", dur: "13 min", por: "E. Santillán" },
];
export const EJ_TG: Record<Target, string> = { Robo: "EJ-0013", Hurto: "EJ-0014" };
export const CFG = {
  nombre: "Configuración experimental del Protocolo",
  ver: "1.0",
  sha: "9f2c4e1a7b03d8e5c6f14a92b7e0d3c85a1f6e2b4d9c07a3e8f5b1c2d4a6e903",
};

export type EstadoVersion = "integra" | "con_pendientes" | "inconsistente" | "validando" | "registrada";
export interface Version {
  id: string;
  nom: string;
  corte: string;
  ver: string;
  st: EstadoVersion;
  fecha: string;
  sha: string;
}
export const VERS: Version[] = [
  { id: "v3", nom: "sidpol_denuncias_2018_2026-07.csv", corte: "2026-07", ver: "v1", st: "integra", fecha: "28/09/2026 08:55", sha: "4b7e21c09d3fa6e8b15c2d7a90e4f36c1b8d5a02e7f9c4136a0d8b2e5f71c3a9" },
  { id: "v2", nom: "sidpol_denuncias_2018_2026-06.csv", corte: "2026-06", ver: "v1", st: "integra", fecha: "03/09/2026 17:31", sha: "e1d09a4c7b52f3e8061c9d2a4f7b3e5c8a0d6f2b9e1c47a3d5f8b0e2c6a9d17f" },
  { id: "v1", nom: "sidpol_denuncias_2018_2026-05.csv", corte: "2026-05", ver: "v1", st: "inconsistente", fecha: "12/08/2026 10:48", sha: "77c2e9b04a1d6f38e5b2c90d7a4e1f6b3c8d2a5e0f9b4c7d1e6a3f8b2c5d0e94" },
];
export const V4 = {
  id: "v4",
  nom: "sidpol_denuncias_2018_2026-08.csv",
  corte: "2026-08",
  ver: "v1",
  fecha: "29/09/2026 10:21",
  sha: "c90a3e7f1b4d28e6a5c0f9d3b7e2a4c1f8d6b0e3a9c5f27d4b1e8a6c3f0d2b75",
};
export const ESTV: Record<EstadoVersion, [string, string]> = {
  integra: ["ok", "Íntegra"],
  con_pendientes: ["wa", "Con pendientes"],
  inconsistente: ["er", "Inconsistente"],
  validando: ["in", "Validando"],
  registrada: ["mu", "Registrada"],
};
export const PEND = [
  { id: "P-01", txt: "S.J. DE LURIGANCHO", cod: "150144", sug: "San Juan de Lurigancho (150132)", n: 48 },
  { id: "P-02", txt: "STA. MARIA DEL MAR", cod: "150143", sug: "Santa María del Mar (150138)", n: 3 },
  { id: "P-03", txt: "LIMA – SIN ESPECIFICAR", cod: "150199", sug: "", n: 12 },
];

/* ---- Roles y pantallas ---- */
export const ROLES: Record<Rol, { n: string; sc: Pantalla[] }> = {
  usuario: { n: "Usuario", sc: ["p1", "p2"] },
  analista: { n: "Analista de datos", sc: ["p1", "p2", "p3", "p5"] },
  admin: { n: "Administrador del sistema", sc: ["p4"] },
};
export const SC: Record<Pantalla, { t: string; st: [string, string][] }> = {
  p1: { t: "Resumen y Comparación", st: [["normal","Resultado"],["cargando","Carga"],["sinejec","Sin ejecuciones completadas"],["red","Error de red"]] },
  p2: { t: "Resultados Individuales", st: [["normal","Resultado"],["cargando","Carga"],["bajo","Serie con bajo volumen de denuncias y alta presencia de ceros"],["exporterr","Error de exportación"]] },
  p3: { t: "Estrategias y Trazabilidad", st: [["normal","Resultado"],["encurso","Ejecución en curso (no comparable)"],["fallida","Ejecución fallida (no comparable)"]] },
  p5: { t: "Ejecuciones", st: [["normal","Última completada"],["bloq","Versión no íntegra seleccionada"],["encurso","Ejecución en curso"],["fallida","Ejecución fallida"],["vacio","Historial vacío"]] },
  p4: { t: "Versiones de datos", st: [["normal","Versión íntegra"],["validando","Validación en curso"],["pendientes","Con pendientes"],["inconsistente","Inconsistente"],["duplicada","Versión duplicada"],["modificar","Intento de modificar"]] },
};

/* ---- Textos ---- */
export const FICHA: [string, string][] = [
  ["Procedencia de los datos","Los valores provienen del registro de denuncias del SIDPOL, publicado por el MININTER en su portal de datos abiertos. Cada resultado se calcula sobre una versión de datos identificada por nombre de archivo, periodo de corte y huella SHA-256, que el administrador registró y verificó."],
  ["Qué se mide","Denuncias registradas de robo y de hurto por distrito y mes. Una denuncia registrada no equivale a un delito ocurrido: depende de que la persona denuncie y de cómo se registre. Los meses sin denuncias en el archivo se tratan como cero y quedan marcados como valores reconstruidos."],
  ["Cambio de régimen de noviembre 2024","Desde noviembre de 2024 cambió el criterio de registro y el nivel de las series cae de forma marcada, sobre todo en robo. Por eso los resultados pueden verse en tres periodos: General, Pre-break y Post-break."],
  ["Estrategias y modelos de referencia","Local ajusta un modelo XGBoost por cada distrito. Global ajusta un único XGBoost con los 43 distritos. naïve-1 repite el último mes observado y naïve estacional repite el mismo mes del año anterior; sirven como punto de comparación mínimo."],
  ["Métricas","MAE es el error absoluto medio y RMSE la raíz del error cuadrático medio, ambos en denuncias por mes; RMSE pesa más los errores grandes. MASE divide ese error entre el de un pronóstico ingenuo en el periodo de entrenamiento; si la serie no varía en ese periodo, MASE no se puede calcular. Las pruebas de significancia no forman parte de la plataforma."],
  ["Alcance y usos no previstos","La plataforma describe el desempeño de cada estrategia. No declara una estrategia ganadora, no califica distritos por riesgo o prioridad y no recomienda acciones ni asignación de recursos."],
  ["Versión de esta ficha","Ficha 1.0, asociada a la configuración experimental 1.0. Actualizada el 26/09/2026."],
];

export const SPEC: Record<Pantalla, string[]> = {
  p1: ["P1. Resumen y comparación de distritos (Figura 6.10, Tabla 6.21)","El usuario elige un target, revisa el resumen de desempeño retrospectivo entre distritos, filtra por estrategia o distrito y compara dos o más distritos en una tabla ordenable. Cubre RF-19, RF-22, RF-23 y RF-25.","Ofrecer una visión de conjunto comparable sin inducir una lectura de ranking de peligrosidad.","Carga; sin ejecuciones completadas para el target; métrica no calculable en series con bajo volumen de denuncias y alta presencia de ceros (celda explicada, no vacía); error de red; sesión expirada (ver login).","Se usa una tabla y no un mapa o un semáforo; el orden por columna es una acción explícita del usuario y el orden inicial es alfabético; ningún distrito recibe etiquetas como \"alto riesgo\", \"prioritario\" o \"crítico\", en aplicación de la regla transversal del sistema.","HU0015, HU0018, HU0019, HU0020; RF-19, RF-22, RF-23, RF-25; RNF-01, RNF-08."],
  p2: ["P2. Resultados de un distrito (Figura 6.11, Tabla 6.22)","El usuario consulta la serie histórica del distrito y los valores pronosticados frente a los observados, filtra por periodo sin recalcular, abre la ficha y exporta. Cubre RF-20, RF-21, RF-23, RF-24 y RF-25.","Que el usuario vea cuánto se aproximaron los pronósticos a lo observado y entienda que la caída de nivel posterior a noviembre de 2024 corresponde a un cambio de régimen de medición.","Carga; periodo sin observado disponible (se muestra solo el pronóstico, rotulado); serie con bajo volumen de denuncias y alta presencia de ceros (texto de ayuda); cambio de vista General/Pre/Post sin nueva ejecución; error de exportación.","Las estrategias se distinguen por tipo de línea y leyenda, no solo por color; la marca de régimen es permanente; el aviso se incluye en la vista y en ambos formatos de exportación (HU0020-2).","HU0016, HU0017, HU0019, HU0020; RF-20, RF-21, RF-23 a RF-25; RNF-01, RNF-08."],
  p3: ["P3. Comparación de estrategias y trazabilidad (Figura 6.12, Tabla 6.23)","El Analista compara el desempeño retrospectivo de las cuatro estrategias, observa la diferencia entre Local y Global, filtra por distritos y audita el origen de un valor puntual. Cubre RF-16, RF-17 y RF-18.","Permitir un análisis comparativo sin posibilidad de alterar el experimento; el riesgo de error es confundir un resultado descriptivo con una conclusión estadística.","Ejecución en curso o fallida (no comparable); distrito sin métricas; valor sin observado disponible.","La diferencia entre estrategias se presenta como un número neutro, sin íconos, colores ni textos del tipo \"mejor\" o \"ganador\" (HU0012-2); los modelos de referencia se muestran siempre junto a Local y Global y sin parámetros editables (HU0013); la vista remite a la ficha para el alcance de las métricas.","HU0012, HU0013, HU0014; RF-16 a RF-18; RNF-07."],
  p4: ["P4. Registro y verificación de versiones de datos (Figura 6.13, Tabla 6.24)","El Administrador registra una versión, consulta el listado y el detalle de integridad y resuelve los distritos no reconocidos. Cubre RF-03 a RF-07.","Que el Administrador sepa sin ambigüedad si una versión es utilizable y qué debe hacer si no lo es.","Versión duplicada (HU0001-2); validación en curso; inconsistente (hash no coincide o control fallido); con pendientes; intento de modificar o eliminar una versión (bloqueado con sugerencia, HU0003-2); permiso denegado (cambia el rol a Usuario o Analista).","El resultado se presenta control por control y no como un único mensaje; la versión solo cambia a íntegra cuando no quedan pendientes; la equivalencia asignada muestra autor y fecha.","HU0001 a HU0004; RF-03 a RF-07; RNF-05, RNF-06, RNF-10."],
  p5: ["P5. Inicio y seguimiento de ejecuciones (Figura 6.14, Tabla 6.25)","El Analista inicia una ejecución, sigue su estado y abre ejecuciones previas desde el historial. Cubre RF-12, RF-14 y RF-15.","Que iniciar una ejecución sea simple y no configurable, y que su estado sea siempre visible.","Versión no íntegra (inicio bloqueado con la inconsistencia visible, HU0009-2); ejecución en curso; fallida con mensaje; historial vacío.","La configuración se muestra como información, sin campos editables (HU0009-1); las versiones no íntegras aparecen deshabilitadas con su motivo en lugar de ocultarse.","HU0009, HU0010, HU0011; RF-12, RF-14, RF-15; RNF-06, RNF-09."],
};
