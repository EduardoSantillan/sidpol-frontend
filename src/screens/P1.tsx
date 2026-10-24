import { useMemo } from "react";
import { DISTRITOS, EJEC, EJ_TG, EST, fmt, metr, type Estrategia } from "../lib/data";
import { useApp } from "../lib/store";
import { Alert, EstChecks, ISearch, NoCalc, SegMet, SegVista, Skel, Sw, TgSelect } from "../components/ui";

const perN = { general: "general", pre: "pre-break", post: "post-break" } as const;

export default function P1() {
  const { S, set } = useApp();
  const ej = EJEC.find((e) => e.id === EJ_TG[S.tg])!;
  const dg = S.metric === "mase" ? 2 : 1;
  const M = S.metric.toUpperCase();

  const head = (
    <div className="head">
      <div>
        <h1>Resumen de desempeño retrospectivo</h1>
        <p className="sub">Desempeño de cada estrategia al pronosticar meses ya observados en los 43 distritos de Lima. Ejecución {ej.id} · {ej.ver}.</p>
      </div>
      <div className="row">
        <span className="muted sm">{S.sel.length} distritos seleccionados</span>
        <button className="btn" disabled={S.sel.length < 2} onClick={() => set({ onlySel: !S.onlySel })}>
          {S.onlySel ? "Mostrar todos" : "Comparar seleccionados"}
        </button>
      </div>
    </div>
  );

  const filt = (
    <div className="card">
      <div className="filters">
        <TgSelect />
        <div className="fld"><span className="lbl">Estrategias de pronóstico</span><div className="chks"><EstChecks /></div></div>
        <div className="fld"><span className="lbl">Métrica</span><SegMet /></div>
        <div className="fld"><span className="lbl">Periodo evaluado</span><SegVista /></div>
        <label className="fld search" style={{ flex: 1, minWidth: 220 }}>
          <span className="lbl">Buscar distrito</span>
          <span style={{ position: "relative", display: "block" }}>
            <ISearch />
            <input placeholder="Escriba para filtrar..." value={S.busca} onChange={(e) => set({ busca: e.target.value })} />
          </span>
        </label>
      </div>
    </div>
  );

  const { col, dir } = S.sort;
  const rows = useMemo(() => {
    let r = DISTRITOS.filter((d) => !S.busca || d.toLowerCase().includes(S.busca.toLowerCase())).map((d) => ({ d, m: metr(d, S.tg, S.vista) }));
    if (S.onlySel) r = r.filter((x) => S.sel.includes(x.d));
    r.sort((a, b) => {
      if (col === "distrito") return a.d.localeCompare(b.d, "es") * dir;
      const va = a.m[col as Estrategia][S.metric];
      const vb = b.m[col as Estrategia][S.metric];
      if (va == null) return 1;
      if (vb == null) return -1;
      return (va - vb) * dir;
    });
    return r;
  }, [S.busca, S.tg, S.vista, S.onlySel, S.sel, S.metric, col, dir]);

  if (S.state === "cargando") return <>{head}<div className="stack">{filt}<Skel h={360} /></div></>;
  if (S.state === "sinejec")
    return (
      <>
        {head}
        <div className="stack">
          {filt}
          <div className="card stack" style={{ padding: 32 }}>
            <h2>Todavía no hay resultados para {S.tg}</h2>
            <p className="muted" style={{ maxWidth: "62ch" }}>Los resultados aparecen cuando el analista de datos completa una ejecución del experimento para este target. La última ejecución de {S.tg} falló y no dejó resultados consultables.</p>
          </div>
        </div>
      </>
    );
  if (S.state === "red")
    return (
      <>
        {head}
        <div className="stack">
          {filt}
          <Alert kind="er" role="alert">
            <b>No se pudieron cargar los resultados.</b> Se perdió la conexión con el servidor. Revisa tu conexión y vuelve a intentarlo; los filtros elegidos se conservan.{" "}
            <button className="btn sec xs" style={{ marginLeft: 6 }} onClick={() => set({ state: "normal" })}>Reintentar</button>
          </Alert>
        </div>
      </>
    );

  const es = EST.filter(([s]) => S.estSel[s]);
  const med = (s: Estrategia) => {
    const v = rows.map((r) => r.m[s][S.metric]).filter((x): x is number => x != null).sort((a, b) => a - b);
    return v.length ? v[Math.floor(v.length / 2)] : null;
  };
  const sortBy = (k: string) => set({ sort: S.sort.col === k ? { col: k, dir: (-S.sort.dir) as 1 | -1 } : { col: k, dir: 1 } });
  const Th = ({ k, t, n }: { k: string; t: string; n?: boolean }) => {
    const on = col === k;
    return (
      <th className={n ? "n" : ""} aria-sort={on ? (dir > 0 ? "ascending" : "descending") : "none"}>
        <button className="sort" onClick={() => sortBy(k)}>{t} <span className="muted">{on ? (dir > 0 ? "↑" : "↓") : "⇅"}</span></button>
      </th>
    );
  };
  const nota =
    S.metric === "mase" ? "MASE menor que 1 indica menos error que un pronóstico ingenuo en el periodo de entrenamiento."
    : S.metric === "mae" ? "MAE en denuncias registradas por mes."
    : "RMSE en denuncias registradas por mes; penaliza más los errores grandes.";

  return (
    <>
      {head}
      <div className="stack">
        {filt}
        <div className="kpis">
          {EST.map(([s, t]) => {
            const v = med(s);
            const nc = rows.filter((r) => r.m[s][S.metric] == null).length;
            return (
              <div key={s} className="card kpi" style={S.estSel[s] ? undefined : { opacity: 0.45 }}>
                <div className="k">{t} · mediana {M}</div>
                <div className="v">{v == null ? "—" : fmt(v, dg)}</div>
                <div className="d"><Sw s={s} /> {rows.length - nc} de {rows.length} distritos con métrica calculable</div>
              </div>
            );
          })}
        </div>
        <p className="muted xs" style={{ marginTop: -6 }}>Resumen agregado para {S.tg.toLowerCase()}, periodo {perN[S.vista]}. {nota}</p>
        <div className="tbl" style={{ maxHeight: 560, overflowY: "auto" }}>
          <table>
            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
              <tr>
                <th />
                <Th k="distrito" t="Distrito" />
                {es.map(([s, t]) => <Th key={s} k={s} t={`${M} ${t}`} n />)}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.d} className={S.sel.includes(r.d) ? "sel" : undefined}>
                  <td style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${r.d}`}
                      checked={S.sel.includes(r.d)}
                      style={{ accentColor: "var(--ink)", width: 15, height: 15 }}
                      onChange={(e) => {
                        const sel = e.target.checked ? [...S.sel, r.d] : S.sel.filter((x) => x !== r.d);
                        set({ sel, onlySel: sel.length < 2 ? false : S.onlySel });
                      }}
                    />
                  </td>
                  <td className="b">{r.d}</td>
                  {es.map(([s]) => {
                    const v = r.m[s][S.metric];
                    return v == null ? <NoCalc key={s} /> : <td key={s} className="n">{fmt(v, dg)}</td>;
                  })}
                  <td className="n"><button className="btn sec xs" onClick={() => set({ dist: r.d, screen: "p2", state: "normal" })}>Ver distrito →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted xs">Orden inicial alfabético. Ordenar por una columna es una acción tuya y no representa peligrosidad. Marca dos o más distritos y pulsa “Comparar seleccionados”.</p>
      </div>
    </>
  );
}
