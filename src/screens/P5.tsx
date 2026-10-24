import { useEffect, useState } from "react";
import { CFG, EJEC, VERS, type Ejecucion, type Target } from "../lib/data";
import { useApp } from "../lib/store";
import { Alert, ILock } from "../components/ui";

const PS: Record<Ejecucion["st"], [string, string]> = { ok: ["ok", "Completada"], er: ["er", "Fallida"], run: ["wa", "En curso"] };

export default function P5() {
  const { S, set, showToast } = useApp();
  const st = S.state;
  const vselInicial = st === "bloq" ? "v1" : "v3";
  const [ver, setVer] = useState(vselInicial);
  useEffect(() => setVer(vselInicial), [vselInicial]);

  let hist: Ejecucion[] = EJEC.slice();
  if (st === "encurso") hist.unshift({ id: "EJ-0015", tg: "Robo", ver: "SIDPOL-2026-07 · v1", st: "run", ini: "29/09/2026 10:40", dur: "04 min", por: "M. Barzola" });
  if (st === "fallida") hist.unshift({ id: "EJ-0015", tg: "Robo", ver: "SIDPOL-2026-07 · v1", st: "er", ini: "29/09/2026 10:40", dur: "06 min", por: "M. Barzola", msg: "Etapa 6 (Ajuste e inferencia): el Motor Global se detuvo por falta de memoria al ajustar el origen 2025-11." });

  const p5sel = st === "encurso" || st === "fallida" ? "EJ-0015" : S.p5sel === "EJ-0015" ? "EJ-0013" : S.p5sel;
  useEffect(() => {
    if (p5sel !== S.p5sel) set({ p5sel });
  }, [p5sel, S.p5sel, set]);

  const verBloq = VERS.find((v) => v.id === ver)?.st !== "integra";
  const ini = (
    <div className="card stack">
      <h2>Iniciar ejecución del experimento</h2>
      <div className="filters" style={{ gap: 16 }}>
        <label className="fld" style={{ flex: 2, minWidth: 300 }}>
          <span className="lbl">Versión de datos (solo íntegras habilitadas)</span>
          <select value={ver} onChange={(e) => setVer(e.target.value)}>
            {VERS.map((v) => (
              <option key={v.id} value={v.id} disabled={v.st !== "integra" && st !== "bloq"}>
                {v.corte} · {v.ver} · {v.nom}{v.st === "integra" ? " (Íntegra)" : " (Deshabilitada: inconsistente)"}
              </option>
            ))}
          </select>
        </label>
        <label className="fld" style={{ flex: 1, minWidth: 200 }}>
          <span className="lbl">Variable objetivo (Target)</span>
          <select value={S.tg} onChange={(e) => set({ tg: e.target.value as Target })}>
            <option value="Robo">Robo (Denuncias)</option><option value="Hurto">Hurto (Denuncias)</option>
          </select>
        </label>
      </div>
      <div className="card" style={{ background: "var(--surface2)", padding: "14px 16px" }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span className="lbl" style={{ textTransform: "uppercase", fontWeight: 700, fontSize: 11, margin: 0 }}><ILock /> Configuración aprobada (solo lectura)</span>
        </div>
        <div className="filters" style={{ gap: "12px 32px", marginTop: 8 }}>
          <div><div className="muted xs">Nombre</div><b className="sm">{CFG.nombre}</b></div>
          <div><div className="muted xs">Versión</div><b className="sm">{CFG.ver}</b></div>
          <div style={{ flex: 1, minWidth: 240 }}><div className="muted xs">SHA-256</div><span className="hash">{CFG.sha}</span></div>
        </div>
        <p className="muted xs" style={{ marginTop: 8 }}>Orígenes, horizonte (1 mes), variantes, métricas y semillas están definidos en el Protocolo Metodológico. Para cambiarlos se aprueba y despliega una nueva configuración.</p>
      </div>
      {st === "bloq" && (
        <Alert kind="er" role="alert"><b>No se puede iniciar sobre esta versión.</b> 2026-05 · v1 es inconsistente: el hash no coincide con el registrado y faltan 2 meses. Elige una versión íntegra o pide al administrador que registre una nueva.</Alert>
      )}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted xs">{st === "encurso" ? "Ya hay una ejecución en curso para Robo." : "Se pedirá confirmación antes de iniciar."}</span>
        <button className="btn" disabled={st === "bloq" || st === "encurso" || verBloq} onClick={() => set({ modal: "confirmar" })}>Iniciar ejecución</button>
      </div>
    </div>
  );

  const titulo = (
    <div className="head">
      <div><h1>Ejecuciones del experimento</h1><p className="sub">Ejecuta el experimento aprobado sobre una versión íntegra y sigue su estado.</p></div>
    </div>
  );

  if (st === "vacio")
    return (
      <>
        {titulo}
        <div className="stack" style={{ gap: 24 }}>
          {ini}
          <div className="card" style={{ padding: 32 }}>
            <h2>Historial de ejecuciones</h2>
            <p className="muted" style={{ marginTop: 6 }}>Todavía no se ha iniciado ninguna ejecución. Elige una versión íntegra y un target, y pulsa “Iniciar ejecución”.</p>
          </div>
        </div>
      </>
    );

  const e = hist.find((x) => x.id === p5sel) ?? hist[0];
  const pasos = (clases: [string, string, string, string]) => (
    <ol className="steps">
      {["5. Orígenes y variables", "6. Ajuste e inferencia", "7. Postproceso y métricas", "8. Persistencia y cierre"].map((t, i) => (
        <li key={t} className={clases[i] || undefined}>{t}</li>
      ))}
    </ol>
  );
  const estado =
    e.st === "run" ? (
      <>
        {pasos(["d", "n", "", ""])}
        <div>
          <div className="bar"><span style={{ width: "55%" }} /></div>
          <div className="row xs muted" style={{ justifyContent: "space-between", marginTop: 6 }}><span>Ajustando modelos locales</span><b style={{ color: "var(--ink)" }}>24 / 43 distritos</b></div>
        </div>
      </>
    ) : e.st === "er" ? (
      <>
        {pasos(["d", "f", "", ""])}
        <Alert kind="er" role="alert"><b>Error de procesamiento.</b> {e.msg} No se guardaron resultados parciales; los consultables siguen siendo los de la última ejecución completada de {e.tg}.</Alert>
      </>
    ) : (
      <>
        {pasos(["d", "d", "d", "d"])}
        <Alert kind="ok"><b>Completada en {e.dur}.</b> Sus resultados están disponibles para consulta y exportación.</Alert>
      </>
    );

  return (
    <>
      {titulo}
      <div className="stack" style={{ gap: 24 }}>
        {ini}
        <div className="g2b">
          <div className="tbl">
            <table>
              <thead><tr><th>Identificador</th><th>Target</th><th>Versión de datos</th><th>Estado</th><th>Inicio</th><th className="n">Duración</th></tr></thead>
              <tbody>
                {hist.map((x) => (
                  <tr key={x.id} className={"link" + (x.id === p5sel ? " sel" : "")} onClick={() => set({ p5sel: x.id, state: st === "encurso" || st === "fallida" ? "normal" : st })}>
                    <td className="b">{x.id}</td><td>{x.tg}</td><td>{x.ver}</td>
                    <td><span className={`pill ${PS[x.st][0]}`}>{PS[x.st][1]}</span></td>
                    <td className="muted">{x.ini}</td><td className="n">{x.dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="card stack">
            <div><h2>Detalle de ejecución</h2><p className="muted xs" style={{ marginTop: 4 }}>Estado y diagnóstico de la ejecución seleccionada.</p></div>
            <hr className="divider" />
            <dl className="ro" style={{ marginTop: -8 }}>
              <dt>ID seleccionado</dt><dd>{e.id}</dd>
              <dt>Versión · Target</dt><dd>{e.ver} · {e.tg}</dd>
              <dt>Iniciada por</dt><dd>{e.por}, {e.ini}</dd>
            </dl>
            {estado}
            <hr className="divider" />
            <button className={`btn ${e.st === "ok" ? "" : "sec"} sm`} style={{ justifyContent: "center" }} disabled={e.st !== "ok"}
              onClick={() => set({ p3ej: e.id, trace: null, screen: "p3", state: "normal" })}>
              Ver resultados de ejecución
            </button>
            <button className="btn sec sm" style={{ justifyContent: "center" }} onClick={() => showToast(`Se descargó ${e.id}.log`)}>Descargar log</button>
          </aside>
        </div>
      </div>
    </>
  );
}
