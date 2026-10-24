import { useEffect, useState, type ReactNode } from "react";
import { DISTRITOS, ESTV, PEND, V4, VERS, type EstadoVersion, type Version } from "../lib/data";
import { useApp } from "../lib/store";
import { Alert, IUp, ILock, IWarn } from "../components/ui";

const ckI: Record<string, ReactNode> = {
  ok: <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 8.5l3.2 3L13 4.5" /></svg>,
  er: <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M4 4l8 8M12 4l-8 8" /></svg>,
  wa: <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor"><rect x="7" y="3" width="2" height="7" /><rect x="7" y="11.5" width="2" height="2" /></svg>,
  pe: null,
};
const Check = ({ e, t, dd }: { e: "ok" | "er" | "wa" | "pe"; t: string; dd?: string }) => (
  <li>
    <span className={`ck ${e}`}>{ckI[e]}</span>
    <div>{t}{dd && <div className="muted xs">{dd}</div>}</div>
  </li>
);

export default function P4() {
  const { S, set, showToast } = useApp();
  const st = S.state;
  const [elegidos, setElegidos] = useState<Record<string, string>>({});

  let vs: Version[] = VERS.map((v) => ({ ...v }));
  if (st === "validando") vs.unshift({ ...V4, st: "validando" });
  if (st === "pendientes") vs.unshift({ ...V4, st: "con_pendientes" });

  // La versión seleccionada se deriva del estado de pantalla del prototipo.
  const forced = st === "inconsistente" ? "v1" : st === "validando" || st === "pendientes" ? "v4" : null;
  const verSel = forced ?? (vs.find((v) => v.id === S.verSel) ? S.verSel : "v3");
  useEffect(() => {
    if (verSel !== S.verSel) set({ verSel });
  }, [verSel, S.verSel, set]);
  const sel = vs.find((v) => v.id === verSel) ?? vs[0];

  const open = PEND.filter((p) => !S.pend[p.id]);
  const dupFile = st === "duplicada";
  const fname = dupFile ? VERS[0].nom : V4.nom;

  const form = (
    <div className="card stack">
      <h2>Registrar nueva versión de datos</h2>
      <div className="filters" style={{ gap: 16 }}>
        <label className="fld" style={{ flex: 1, minWidth: 260 }}><span className="lbl">Nombre de archivo</span><input defaultValue={fname} key={fname} /></label>
        <label className="fld"><span className="lbl">Periodo de corte</span><input type="month" defaultValue={dupFile ? "2026-07" : "2026-08"} key={String(dupFile)} /></label>
        <label className="fld"><span className="lbl">Versión</span><input defaultValue="v1" style={{ minWidth: 90, width: 90 }} /></label>
      </div>
      <div className="drop">
        <span className="muted"><IUp /></span>
        <b>Arrastre el archivo CSV aquí o haga clic para buscar</b>
        <span className="muted xs">Archivo descargado del portal de datos abiertos del MININTER. Máximo 50 MB.</span>
        <span className="chip" style={{ marginTop: 6 }}><b>SHA-256 calculado:</b><span className="hash">{dupFile ? VERS[0].sha : V4.sha}</span></span>
      </div>
      {dupFile && (
        <Alert kind="er" role="alert"><b>Ya existe una versión con este nombre de archivo y periodo de corte</b> (registrada el 28/09/2026). No se registró nada. Si el archivo cambió, usa otro nombre de archivo.</Alert>
      )}
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="muted xs">Al registrar se inicia la verificación de integridad. La versión solo queda disponible si resulta íntegra.</span>
        <button className="btn" onClick={() => set({ state: "validando" })}>Registrar versión</button>
      </div>
    </div>
  );

  const list = (
    <div className="tbl">
      <table>
        <thead><tr><th>Nombre de archivo</th><th>Corte</th><th>Versión</th><th>SHA-256</th><th>Estado</th></tr></thead>
        <tbody>
          {vs.map((v) => (
            <tr key={v.id} className={"link" + (v.id === sel.id ? " sel" : "")} onClick={() => set({ verSel: v.id, state: ["inconsistente", "validando", "pendientes"].includes(st) ? "normal" : st })}>
              <td className="b">{v.nom}</td><td>{v.corte}</td><td>{v.ver}</td>
              <td className="hash muted">{v.sha.slice(0, 8)}…{v.sha.slice(-2)}</td>
              <td><span className={`pill ${ESTV[v.st as EstadoVersion][0]}`}>{ESTV[v.st as EstadoVersion][1]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  let checks: ReactNode[];
  if (sel.st === "validando")
    checks = [<Check key="1" e="ok" t="Coincidencia de hash SHA-256" />, <Check key="2" e="ok" t="Estructura de columnas" />, <Check key="3" e="pe" t="Continuidad mensual de registros" />, <Check key="4" e="pe" t="Recuentos positivos" />, <Check key="5" e="pe" t="Unicidad de claves" />, <Check key="6" e="pe" t="Reconocimiento de códigos UBIGEO" />];
  else if (sel.st === "inconsistente")
    checks = [<Check key="1" e="er" t="Coincidencia de hash SHA-256" dd="El recalculado no coincide con el registrado: el archivo cambió después del registro" />, <Check key="2" e="ok" t="Estructura de columnas" />, <Check key="3" e="er" t="Continuidad mensual de registros" dd="Faltan 2025-02 y 2025-03" />, <Check key="4" e="ok" t="Recuentos positivos" />, <Check key="5" e="ok" t="Unicidad de claves" />, <Check key="6" e="ok" t="Reconocimiento de códigos UBIGEO" />];
  else if (sel.st === "con_pendientes")
    checks = [<Check key="1" e="ok" t="Coincidencia de hash SHA-256" />, <Check key="2" e="ok" t="Estructura de columnas" />, <Check key="3" e="ok" t="Continuidad mensual de registros" />, <Check key="4" e="ok" t="Recuentos positivos" />, <Check key="5" e="ok" t="Unicidad de claves" />,
      open.length ? <Check key="6" e="wa" t="Reconocimiento de códigos UBIGEO" dd={`${open.length} códigos sin equivalencia (${open.reduce((a, p) => a + p.n, 0)} registros)`} /> : <Check key="6" e="ok" t="Reconocimiento de códigos UBIGEO" dd="Pendientes resueltos" />];
  else
    checks = [<Check key="1" e="ok" t="Coincidencia de hash SHA-256" />, <Check key="2" e="ok" t="Estructura de columnas" />, <Check key="3" e="ok" t="Continuidad mensual de registros" />, <Check key="4" e="ok" t="Recuentos positivos" />, <Check key="5" e="ok" t="Unicidad de claves" />, <Check key="6" e="ok" t="Reconocimiento de códigos UBIGEO" dd="43 de 43 distritos" />];

  const match = sel.st !== "inconsistente";
  const pendDone = sel.st === "con_pendientes" && !open.length;
  const res =
    sel.st === "integra" || pendDone ? <Alert kind="ok"><b>Versión íntegra.</b> Disponible para iniciar ejecuciones.</Alert>
    : sel.st === "inconsistente" ? <Alert kind="er"><b>Inconsistente: no se puede usar.</b> Registra una nueva versión con el archivo descargado de nuevo.</Alert>
    : sel.st === "con_pendientes" ? <Alert kind="wa"><b>Faltan {open.length} equivalencias.</b> Pasará a íntegra cuando no quede ninguna.</Alert>
    : <Alert kind="in"><b>Validando.</b> El estado se actualiza solo.</Alert>;

  const audit = (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2>Auditoría de integridad</h2><span className="pill mu">{sel.corte} · {sel.ver}</span>
      </div>
      <p className="muted xs" style={{ marginTop: -8 }}>Resultado control por control de la versión seleccionada.</p>
      <hr className="divider" />
      <ul className="checks">{checks}</ul>
      <div className="card" style={{ background: "var(--surface2)", padding: 12 }}>
        <span className="lbl" style={{ textTransform: "uppercase", fontWeight: 700, fontSize: 11 }}>Comparación de hashes</span>
        <div className="xs muted">Registrado: <span className="hash" style={{ color: "var(--ink)" }}>{sel.sha.slice(0, 10)}…{sel.sha.slice(-4)}</span></div>
        <div className="xs muted">Recalculado: <span className="hash" style={{ color: match ? "var(--ok)" : "var(--er)" }}>{match ? `${sel.sha.slice(0, 10)}…${sel.sha.slice(-4)} (coincide)` : "91be04c7a2…8f3d (no coincide)"}</span></div>
      </div>
      {res}
    </div>
  );

  const pend = sel.st === "con_pendientes" && (
    <div className="card stack">
      <div>
        <h2>Resolución de distritos con códigos no reconocidos ({sel.corte} · {sel.ver})</h2>
        <p className="muted sm" style={{ marginTop: 4 }}>Asigna el distrito oficial equivalente a cada código. La versión quedará <b style={{ color: "var(--ok)" }}>íntegra</b> cuando no quede ninguno pendiente.</p>
      </div>
      <div className="tbl">
        <table>
          <thead><tr><th>Código y nombre en el archivo</th><th className="n">Registros</th><th>Distrito oficial (UBIGEO)</th><th>Asignación</th><th>Último cambio</th></tr></thead>
          <tbody>
            {PEND.map((p) => {
              const r = S.pend[p.id];
              const sug = p.sug.split(" (")[0];
              return (
                <tr key={p.id}>
                  <td className="b">{p.txt} ({p.cod})</td><td className="n">{p.n}</td>
                  {r ? (
                    <>
                      <td>{r.d}</td><td><span className="pill ok">Asignado</span></td><td className="muted xs">Por E. Santillán, {r.f}</td>
                    </>
                  ) : (
                    <>
                      <td>
                        <select className="inp" style={{ minWidth: 230 }} value={elegidos[p.id] ?? sug} onChange={(e) => setElegidos({ ...elegidos, [p.id]: e.target.value })}>
                          {!p.sug && <option value="">Elegir distrito</option>}
                          {DISTRITOS.map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </td>
                      <td>
                        <button className="btn sec xs" onClick={() => {
                          const v = elegidos[p.id] ?? sug;
                          if (!v) { showToast("Elige un distrito antes de asignar."); return; }
                          set({ pend: { ...S.pend, [p.id]: { d: v, f: "29/09/2026 10:34" } } });
                        }}>Asignar</button>
                      </td>
                      <td className="muted xs">Pendiente de resolución</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="head">
        <div>
          <h1>Administración de versiones de datos</h1>
          <p className="sub">Registra el archivo SIDPOL, revisa su integridad y resuelve distritos no reconocidos. Solo las versiones íntegras quedan disponibles para ejecutar el experimento.</p>
        </div>
      </div>
      <div className="stack" style={{ gap: 24 }}>
        {form}
        <div className="g2b">
          <div className="stack">
            {list}
            <div><button className="btn sec sm" onClick={() => set({ state: "modificar" })}>Eliminar versión seleccionada</button></div>
          </div>
          {audit}
        </div>
        {pend}
        <div className={`alert ${st === "modificar" ? "er" : "wa"}`} role={st === "modificar" ? "alert" : undefined}>
          {st === "modificar" ? <ILock /> : <IWarn />}
          <div>
            <b>{st === "modificar" ? "No se puede eliminar ni modificar esta versión." : "Regla de inmutabilidad de datos históricos."}</b>{" "}
            Las versiones registradas no se modifican ni se eliminan, para que cualquier resultado se pueda reproducir con los mismos datos. Si detectas un error de origen, registra una nueva versión con el archivo corregido.
          </div>
        </div>
      </div>
    </>
  );
}
