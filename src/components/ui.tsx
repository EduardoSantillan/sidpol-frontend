import type { ReactNode } from "react";
import { EST, type Estrategia, type Target } from "../lib/data";
import { useApp } from "../lib/store";

/* ---- Iconos ---- */
const sv = (children: ReactNode, size = 16, sw = 1.6, vb = 16) => (
  <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill="none" stroke="currentColor" strokeWidth={sw} aria-hidden="true">
    {children}
  </svg>
);
export const IErr = () => sv(<><path d="M8 1.5l7 12.5H1z" /><path d="M8 6v4M8 11.8v.4" /></>);
export const IWarn = IErr;
export const IInfo = () => sv(<><circle cx="8" cy="8" r="7" /><path d="M8 7v4.5M8 4.5v.5" /></>);
export const IOk = () => sv(<path d="M3 8.5l3.2 3L13 4.5" />, 16, 1.8);
export const ILock = () => sv(<><rect x="3" y="7" width="10" height="7" rx="1" /><path d="M5 7V5a3 3 0 0 1 6 0v2" /></>, 14);
export const ISearch = () => sv(<><circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" /></>, 15);
export const IDown = () => sv(<path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M2.5 13.5h11" />, 14, 1.8);
export const IDoc = () => sv(<><path d="M4 1.5h5l3 3v10H4z" /><path d="M9 1.5v3h3" /></>, 14);
export const IUp = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </svg>
);
export const ILockBig = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="5" y="10" width="14" height="10" rx="1.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

/* ---- Muestra de trazo por estrategia (monocromo, se distingue por tipo de línea) ---- */
export const LS: Record<Estrategia | "obs", { c: string; d: string; w: number }> = {
  obs: { c: "var(--ink2)", d: "", w: 2 },
  local: { c: "var(--ink)", d: "", w: 2.2 },
  global: { c: "var(--ink)", d: "7 4", w: 2.2 },
  n1: { c: "var(--ink3)", d: "1.5 4", w: 2 },
  ns: { c: "var(--ink2)", d: "10 3 2 3", w: 1.8 },
};
export function Sw({ s }: { s: Estrategia | "obs" }) {
  return (
    <svg width="24" height="8" aria-hidden="true">
      <line x1="0" y1="4" x2="24" y2="4" stroke={LS[s].c} strokeWidth={LS[s].w} strokeDasharray={LS[s].d || undefined} />
    </svg>
  );
}

/* ---- Alertas ---- */
export function Alert({ kind, role, children }: { kind: "er" | "wa" | "ok" | "in"; role?: string; children: ReactNode }) {
  const icon = kind === "er" || kind === "wa" ? <IErr /> : kind === "ok" ? <IOk /> : <IInfo />;
  return (
    <div className={`alert ${kind}`} role={role}>
      {icon}
      <div>{children}</div>
    </div>
  );
}

export const Skel = ({ h = 300 }: { h?: number }) => (
  <div className="card stack" aria-busy="true">
    <div className="skel" style={{ height: 18, width: "30%" }} />
    <div className="skel" style={{ height: h }} />
  </div>
);

/* ---- Controles compartidos ---- */
export function SegVista() {
  const { S, set } = useApp();
  const opts = [["general", "General"], ["pre", "Pre-break (régimen anterior)"], ["post", "Post-break (nuevo régimen)"]] as const;
  return (
    <div className="seg" role="group" aria-label="Periodo evaluado">
      {opts.map(([v, t]) => (
        <button key={v} aria-pressed={S.vista === v} onClick={() => set({ vista: v })}>{t}</button>
      ))}
    </div>
  );
}
export function SegMet() {
  const { S, set } = useApp();
  return (
    <div className="seg" role="group" aria-label="Métrica">
      {(["mase", "mae", "rmse"] as const).map((m) => (
        <button key={m} aria-pressed={S.metric === m} onClick={() => set({ metric: m })}>{m.toUpperCase()}</button>
      ))}
    </div>
  );
}
export function TgSelect({ onChange }: { onChange?: (t: Target) => void }) {
  const { S, set } = useApp();
  return (
    <label className="fld">
      <span className="lbl">Variable objetivo (Target)</span>
      <select value={S.tg} onChange={(e) => { const tg = e.target.value as Target; set({ tg }); onChange?.(tg); }}>
        <option value="Robo">Robo (Denuncias)</option>
        <option value="Hurto">Hurto (Denuncias)</option>
      </select>
    </label>
  );
}
export function EstChecks({ legend }: { legend?: boolean }) {
  const { S, set } = useApp();
  return (
    <>
      {EST.map(([s, t]) => (
        <label key={s}>
          <input type="checkbox" checked={S.estSel[s]} onChange={(e) => set({ estSel: { ...S.estSel, [s]: e.target.checked } })} />
          {legend && <Sw s={s} />} {t}
        </label>
      ))}
    </>
  );
}
export const NoCalc = () => <td className="nc">No calculable: sin variación en el entrenamiento (escala = 0)</td>;
