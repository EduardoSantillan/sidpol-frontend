import { CFG, DISTRITOS, EJEC, ESTN, EST, fmt, labL, metr, N, resultados, serie } from "../lib/data";
import { useApp } from "../lib/store";
import { Alert, ILock, ISearch, SegMet, SegVista } from "../components/ui";

export default function P3() {
  const { S, set } = useApp();
  const ej = EJEC.find((e) => e.id === S.p3ej)!;
  const dg = S.metric === "mase" ? 2 : 1;
  const M = S.metric.toUpperCase();

  const head = (
    <div className="head">
      <div>
        <h1>Comparación de estrategias y trazabilidad</h1>
        <p className="sub">Métricas retrospectivas de Local, Global y los dos modelos de referencia. La comparación es descriptiva; las conclusiones estadísticas se reportan en el Protocolo.</p>
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <label className="fld">
          <span className="lbl">ID de ejecución</span>
          <select value={S.p3ej} onChange={(e) => set({ p3ej: e.target.value, trace: null })}>
            {EJEC.map((e) => <option key={e.id} value={e.id}>{e.id} · {e.tg} · {e.st === "ok" ? "completada" : "fallida"}</option>)}
          </select>
        </label>
        <div className="fld"><span className="lbl">Variable objetivo</span><div className="inp" style={{ background: "var(--surface2)", minWidth: 110 }}>{ej.tg}</div></div>
      </div>
    </div>
  );

  if (S.state === "encurso" || S.state === "fallida" || ej.st === "er") {
    const f = S.state === "fallida" || ej.st === "er";
    return (
      <>
        {head}
        <Alert kind={f ? "er" : "in"} role="status">
          <b>{f ? `La ejecución ${ej.st === "er" ? ej.id : "EJ-0015"} falló y no se puede comparar.` : "La ejecución EJ-0015 está en curso y todavía no se puede comparar."}</b>{" "}
          {f ? (ej.msg || "El ajuste terminó con error.") + " Elige una ejecución completada." : "Los resultados aparecerán cuando termine la etapa de postproceso y métricas."}
        </Alert>
      </>
    );
  }

  const tg = ej.tg;
  const queries = S.p3filtro.split(",").map((q) => q.trim().toLowerCase()).filter(Boolean);
  const rows = DISTRITOS.filter((d) => !S.p3filtro || queries.some((q) => d.toLowerCase().includes(q)));

  const detRows = S.p3dist
    ? resultados(S.p3dist, tg).filter((r) => r.h === S.h && (S.vista === "general" || r.reg === S.vista)).slice(-10)
    : [];

  return (
    <>
      {head}
      <div className="g2">
        <div className="stack">
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="filters" style={{ gap: 16 }}>
              <label className="search" style={{ flex: 1, minWidth: 220, position: "relative", display: "block" }}>
                <ISearch />
                <input className="inp" placeholder="Filtrar distritos en esta vista (ej. San, Lima)" value={S.p3filtro} onChange={(e) => set({ p3filtro: e.target.value })} style={{ width: "100%", border: 0, paddingLeft: 32 }} />
              </label>
              <SegMet />
              <SegVista />
            </div>
          </div>
          <p className="muted xs"><ILock /> Configuración {CFG.ver} aprobada en el Protocolo; sin parámetros editables en esta vista.</p>

          <div className="tbl" style={{ maxHeight: 440, overflowY: "auto" }}>
            <table>
              <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                <tr>
                  <th>Distrito</th><th className="n">{M} Local</th><th className="n">{M} Global</th>
                  <th className="n">{M} Local − {M} Global</th><th className="n">{M} naïve-1</th><th className="n">{M} naïve estacional</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const m = metr(d, tg, S.vista);
                  const ok = EST.every(([s]) => m[s][S.metric] != null);
                  const cls = "link" + (S.p3dist === d ? " sel" : "");
                  const pick = () => set({ p3dist: d, trace: null });
                  if (!ok)
                    return (
                      <tr key={d} className={cls} onClick={pick}>
                        <td className="b">{d}</td>
                        <td className="nc" colSpan={5} style={{ maxWidth: "none" }}>Sin métricas de {M}: la serie de entrenamiento no tiene variación (escala = 0). Los pronósticos sí existen y se pueden auditar.</td>
                      </tr>
                    );
                  const df = (m.local[S.metric] as number) - (m.global[S.metric] as number);
                  return (
                    <tr key={d} className={cls} onClick={pick}>
                      <td className="b">{d}</td>
                      <td className="n">{fmt(m.local[S.metric] as number, dg)}</td>
                      <td className="n">{fmt(m.global[S.metric] as number, dg)}</td>
                      <td className="n">{df > 0 ? "+" : ""}{fmt(df, dg)}</td>
                      <td className="n">{fmt(m.n1[S.metric] as number, dg)}</td>
                      <td className="n">{fmt(m.ns[S.metric] as number, dg)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted xs">Diferencia calculada como {M} Local menos {M} Global. Negativa: Local registró menor {M}. Positiva: Global registró menor {M}. Es descriptiva y no implica que la diferencia sea significativa.</p>

          {S.p3dist && (
            <div className="stack" id="det">
              <div>
                <h3>Valores pronosticados · {S.p3dist}</h3>
                <p className="muted xs" style={{ marginTop: 3 }}>Últimos 10 meses del periodo. Selecciona un valor para auditar su origen.</p>
              </div>
              <div className="tbl">
                <table>
                  <thead><tr><th>Mes pronosticado</th>{EST.map(([, t]) => <th key={t} className="n">{t}</th>)}<th className="n">Observado</th></tr></thead>
                  <tbody>
                    {detRows.map((r) => (
                      <tr key={r.o + "-" + r.h}>
                        <td>{labL(r.t)}</td>
                        {EST.map(([s]) => {
                          const on = S.trace && S.trace.o === r.o && S.trace.h === r.h && S.trace.s === s && S.trace.d === S.p3dist;
                          const go = () => set({ trace: { o: r.o, h: r.h, s, d: S.p3dist } });
                          return (
                            <td key={s} className={"n cell" + (on ? " on" : "")} tabIndex={0} onClick={go} onKeyDown={(e) => e.key === "Enter" && go()}>
                              {fmt(r[s], 1)}
                            </td>
                          );
                        })}
                        <td className="n">{r.obs == null ? <span className="muted">Sin observado</span> : fmt(r.obs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <TraceCard />
      </div>
    </>
  );
}

function TraceCard() {
  const { S } = useApp();
  const hdr = (
    <>
      <h2>Trazabilidad del resultado</h2>
      <p className="muted xs" style={{ marginTop: 4 }}>Selecciona un valor pronosticado para ver de dónde sale.</p>
      <hr className="divider" style={{ margin: "14px 0 2px" }} />
    </>
  );
  if (!S.trace)
    return (
      <aside className="card" style={{ position: "sticky", top: 16 }}>
        {hdr}
        <p className="muted sm" style={{ padding: "28px 0", textAlign: "center" }}>Ningún valor seleccionado</p>
      </aside>
    );
  const ej = EJEC.find((e) => e.id === S.p3ej)!;
  const { o, h, s, d } = S.trace;
  const t = o + h;
  const y = serie(d, ej.tg);
  const r = resultados(d, ej.tg).find((q) => q.o === o && q.h === h)!;
  return (
    <aside className="card" style={{ position: "sticky", top: 16 }} aria-live="polite">
      {hdr}
      <dl className="ro">
        <dt>Valor pronosticado</dt><dd style={{ fontSize: 22, fontWeight: 700 }}>{fmt(r[s], 1)} <span className="muted sm" style={{ fontWeight: 400 }}>denuncias</span></dd>
        <dt>Ejecución</dt><dd>{ej.id}</dd>
        <dt>Variable objetivo</dt><dd>{ej.tg} (denuncias)</dd>
        <dt>Distrito</dt><dd>{d}</dd>
        <dt>Fecha de origen</dt><dd>{labL(o)}</dd>
        <dt>Fecha pronosticada</dt><dd>{labL(t)}</dd>
        <dt>Horizonte</dt><dd>1 mes (fijado en el Protocolo)</dd>
        <dt>Estrategia</dt><dd>{ESTN[s]}</dd>
        <dt>Variante</dt><dd>principal</dd>
        <dt>Denuncias registradas observadas</dt>
        <dd>{t < N ? fmt(y[t]) + " denuncias" : <span className="muted">Aún no disponible (posterior al corte)</span>}</dd>
      </dl>
      <hr className="divider" style={{ margin: "16px 0 4px" }} />
      <dl className="ro">
        <dt>Versión de datos · SHA-256</dt><dd className="hash">{ej.ver}<br />4b7e21c09d3f…5f71c3a9</dd>
        <dt>Configuración · SHA-256</dt><dd className="hash">{CFG.ver}<br />{CFG.sha.slice(0, 12)}…{CFG.sha.slice(-8)}</dd>
        <dt>Commit del código</dt><dd className="hash">a3f9c12</dd>
      </dl>
    </aside>
  );
}
