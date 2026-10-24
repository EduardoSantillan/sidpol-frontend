import { useRef, useState } from "react";
import { BREAK, EST, H, N, O0, fmt, labL, resultados, serie, type Target, type Vista } from "../lib/data";
import type { Estrategia } from "../lib/data";
import { LS } from "./ui";

const W = 1180, HH = 340, ML = 44, MR = 16, MT = 18, MB = 30;

function nice(x: number) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const f = x / p;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p;
}

interface Props {
  distrito: string;
  tg: Target;
  vista: Vista;
  h: number;
  estSel: Record<Estrategia, boolean>;
}

export default function Chart({ distrito: d, tg, vista, h, estSel }: Props) {
  const y = serie(d, tg);
  const rs = resultados(d, tg).filter((r) => r.h === h && (vista === "general" || r.reg === vista));
  const last = N + H - 1;
  const X = (i: number) => ML + (i / last) * (W - ML - MR);
  const act = EST.filter(([s]) => estSel[s]);

  let max = Math.max(...y, ...rs.flatMap((r) => act.map(([s]) => r[s])), 1) * 1.08;
  const st = nice(max / 4);
  max = Math.ceil(max / st) * st;
  const Y = (v: number) => MT + (1 - v / max) * (HH - MT - MB);

  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += st) ticks.push(v);

  const xb = (X(BREAK - 1) + X(BREAK)) / 2;
  const xc = (X(N - 1) + X(N)) / 2;
  const regime = (() => {
    if (vista === "general") return null;
    const a = vista === "pre" ? O0 + 1 : BREAK;
    const b = vista === "pre" ? BREAK - 1 : last;
    return { x: X(a) - 3, w: X(b) - X(a) + 6 };
  })();

  const segs = (s: Estrategia) => {
    const out: typeof rs[] = [];
    let cur: typeof rs = [];
    rs.forEach((r, k) => {
      if (k && r.t !== rs[k - 1].t + 1) { out.push(cur); cur = []; }
      cur.push(r);
    });
    if (cur.length) out.push(cur);
    return out.map((sg) => "M" + sg.map((r) => X(r.t).toFixed(1) + "," + Y(r[s]).toFixed(1)).join(" L"));
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [tipLeft, setTipLeft] = useState(4);

  const onMove = (e: React.MouseEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    let i = Math.round((((e.clientX - r.left) / r.width) * W - ML) / (W - ML - MR) * last);
    i = Math.max(0, Math.min(last, i));
    setHover(i);
    const px = (X(i) / W) * r.width;
    const tw = tipRef.current?.offsetWidth ?? 0;
    setTipLeft(Math.max(4, Math.min(px + 12, r.width - tw - 4)));
  };

  const rr = hover != null ? rs.find((q) => q.t === hover) : undefined;

  return (
    <div className="chart-box">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${HH}`}
        role="img"
        aria-label={`Serie mensual observada y pronósticos a 1 mes de las cuatro estrategias para ${d}`}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line x1={ML} x2={W - MR} y1={Y(v)} y2={Y(v)} stroke="var(--line)" strokeDasharray={v ? "4 4" : undefined} />
            <text x={ML - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="var(--ink2)">{fmt(v)}</text>
          </g>
        ))}
        {regime && <rect x={regime.x} y={MT} width={regime.w} height={HH - MT - MB} fill="var(--regime)" />}
        <line x1={xb} x2={xb} y1={MT} y2={HH - MB} stroke="var(--ink)" strokeDasharray="4 4" />
        <rect x={xb + 8} y={MT + 2} width="170" height="22" rx="4" fill="var(--band)" />
        <text x={xb + 16} y={MT + 17} fontSize="11" fontWeight="600" fill="var(--ink)">Cambio de régimen nov-2024</text>
        <line x1={xc} x2={xc} y1={MT + 30} y2={HH - MB} stroke="var(--line)" />
        <line x1={ML} x2={W - MR} y1={HH - MB} y2={HH - MB} stroke="var(--ink2)" />
        {Array.from({ length: last + 1 }, (_, i) => i).filter((i) => i % 12 === 0).map((i) => (
          <text key={i} x={X(i)} y={HH - 10} textAnchor="middle" fontSize="11" fill="var(--ink2)">ene-{18 + i / 12}</text>
        ))}
        <path
          d={"M" + y.map((v, i) => X(i).toFixed(1) + "," + Y(v).toFixed(1)).join(" L")}
          fill="none" stroke={LS.obs.c} strokeWidth="2" strokeLinejoin="round"
        />
        {y.map((v, i) => i % 3 === 0 && (
          <circle key={i} cx={X(i)} cy={Y(v)} r="2.6" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.3" />
        ))}
        {act.map(([s]) => segs(s).map((p, k) => (
          <path key={s + k} d={p} fill="none" stroke={LS[s].c} strokeWidth={LS[s].w} strokeDasharray={LS[s].d || undefined} />
        )))}
        {hover != null && <line x1={X(hover)} x2={X(hover)} y1={MT} y2={HH - MB} stroke="var(--ink)" opacity=".25" />}
        <rect
          x={ML} y={MT} width={W - ML - MR} height={HH - MT - MB} fill="transparent"
          onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        />
      </svg>
      <div className="tip" ref={tipRef} style={{ opacity: hover != null ? 1 : 0, left: tipLeft, top: 8 }}>
        {hover != null && (
          <>
            <b>{labL(hover)}</b>{hover >= BREAK ? " · post-break" : ""}
            <br />Observado: {hover < N ? fmt(y[hover]) : "aún no disponible"}
            {rr && act.map(([s, n]) => (<span key={s}><br />{n}: {fmt(rr[s], 1)}</span>))}
          </>
        )}
      </div>
    </div>
  );
}
