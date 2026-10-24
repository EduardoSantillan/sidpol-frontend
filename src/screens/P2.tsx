import { BAJOS, DISTRITOS, EJ_TG, EST, O1, fmt, labL, metr, resultados, slug, type Estrategia, type Target } from "../lib/data";
import { useApp } from "../lib/store";
import Chart from "../components/Chart";
import { Alert, EstChecks, IDoc, IDown, SegVista, Skel, Sw } from "../components/ui";

const perN = { general: "general", pre: "pre-break", post: "post-break" } as const;
const desc: Record<Estrategia, string> = {
  local: "Un modelo ajustado solo con la serie de este distrito",
  global: "Un modelo conjunto ajustado con los 43 distritos",
  n1: "Repite el último mes observado",
  ns: "Repite el mismo mes del año anterior",
};

export default function P2() {
  const { S, set, showToast } = useApp();
  const d = S.state === "bajo" ? "Santa María del Mar" : S.dist;

  const head = (
    <div className="head">
      <div>
        <h1>Resultados retrospectivos por distrito</h1>
        <p className="sub">Serie mensual de denuncias registradas y lo que pronosticó cada estrategia frente a lo observado. Ejecución {EJ_TG[S.tg]} · SIDPOL-2026-07 · v1.</p>
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="fld">
          <span className="lbl">Distrito</span>
          <select value={d} onChange={(e) => set({ dist: e.target.value, state: S.state === "bajo" ? "normal" : S.state })}>
            {DISTRITOS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="fld">
          <span className="lbl">Variable objetivo</span>
          <select style={{ minWidth: 110 }} value={S.tg} onChange={(e) => set({ tg: e.target.value as Target, p3ej: EJ_TG[e.target.value as Target] })}>
            <option>Robo</option><option>Hurto</option>
          </select>
        </label>
      </div>
    </div>
  );

  if (S.state === "cargando")
    return (
      <>
        {head}
        <div className="stack">
          <Skel h={340} />
          <div className="kpis">{[1, 2, 3, 4].map((i) => <div key={i} className="card"><div className="skel" style={{ height: 70 }} /></div>)}</div>
        </div>
      </>
    );

  const m = metr(d, S.tg, S.vista);
  const fut = resultados(d, S.tg).filter((r) => r.o === O1);

  return (
    <>
      {head}
      <div className="stack">
        {S.state === "exporterr" && (
          <Alert kind="er" role="alert">
            <b>No se generó el PDF.</b> El servidor no respondió a tiempo al preparar el archivo. Vuelve a intentarlo; si falla otra vez, exporta en CSV, que contiene los mismos valores y metadata.{" "}
            <button className="btn sec xs" style={{ marginLeft: 6 }} onClick={() => set({ state: "normal" })}>Reintentar PDF</button>
          </Alert>
        )}
        {BAJOS.includes(d) && (
          <Alert kind="wa">
            <b>{d} es una serie con bajo volumen de denuncias y alta presencia de ceros{S.tg === "Robo" && d === "Santa María del Mar" ? " (casi todos los meses en cero)" : ""}.</b> Con conteos tan bajos, una o dos denuncias cambian mucho las métricas y MASE puede no ser calculable. Lee estos resultados con cautela.
          </Alert>
        )}

        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2>Serie histórica vs. pronósticos: {d}, {S.tg.toLowerCase()}</h2>
              <p className="muted xs" style={{ marginTop: 4 }}>Cada pronóstico se generó 1 mes antes del mes que estima (horizonte fijado en el Protocolo), solo con los datos disponibles en ese momento.</p>
            </div>
            <div className="row">
              <button className="btn sec sm" onClick={() => showToast(`Se descargó ${slug(d)}_${S.tg.toLowerCase()}_${EJ_TG[S.tg]}.csv con versión y SHA-256, ejecución, configuración, target, distrito, estrategias y el aviso de alcance.`)}><IDown /> Exportar CSV</button>
              <button className="btn sec sm" onClick={() => set({ state: "exporterr" })}><IDoc /> Exportar PDF</button>
            </div>
          </div>
          <Chart distrito={d} tg={S.tg} vista={S.vista} h={S.h} estSel={S.estSel} />
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="legend">
              <span><Sw s="obs" /> Observado</span>
              <EstChecks legend />
            </div>
            <div className="row"><SegVista /></div>
          </div>
          <p className="muted xs">La caída de nivel desde noviembre 2024 corresponde al cambio de régimen de medición del registro, no necesariamente a menos hechos. Cambiar el periodo filtra resultados ya generados; no inicia una nueva ejecución.</p>
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>Métricas de desempeño del distrito ({d}, periodo {perN[S.vista]})</h3>
          <div className="kpis">
            {EST.map(([s, t]) => (
              <div key={s} className="card kpi">
                <div className="k">{t} (MASE)</div>
                <div className="v">
                  {m[s].mase == null ? "No calculable" : fmt(m[s].mase as number, 2)}
                  <small>MAE {fmt(m[s].mae, 1)} · RMSE {fmt(m[s].rmse, 1)}</small>
                </div>
                <div className="d"><Sw s={s} /> {desc[s]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="stack">
          <h3>Mes pronosticado sin observado</h3>
          <p className="muted xs">Pronosticado desde el último origen (jul 2026), posterior al corte de la versión. Se mostrará junto al observado cuando se registre una versión que lo incluya.</p>
          <div className="tbl">
            <table>
              <thead><tr><th>Mes pronosticado</th>{EST.map(([, t]) => <th key={t} className="n">{t}</th>)}<th>Observado</th></tr></thead>
              <tbody>
                {fut.map((r) => (
                  <tr key={r.t}>
                    <td>{labL(r.t)}</td>
                    {EST.map(([s]) => <td key={s} className="n">{fmt(r[s], 1)}</td>)}
                    <td className="muted">Aún no disponible</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
