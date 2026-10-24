import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { Estrategia, Metrica, Pantalla, Rol, Target, Vista } from "./data";

export interface Trace {
  o: number;
  h: number;
  s: Estrategia;
  d: string;
}
export interface Asignacion {
  d: string;
  f: string;
}
export type LoginState = "normal" | "error" | "off" | "exp";
export type Modal = null | "ficha" | "confirmar";

export interface AppState {
  role: Rol;
  screen: Pantalla;
  state: string;
  notes: boolean;
  logged: boolean;
  loginState: LoginState;
  tg: Target;
  dist: string;
  vista: Vista;
  h: number;
  metric: Metrica;
  busca: string;
  estSel: Record<Estrategia, boolean>;
  sort: { col: string; dir: 1 | -1 };
  sel: string[];
  onlySel: boolean;
  p3ej: string;
  p3filtro: string;
  p3dist: string;
  trace: Trace | null;
  verSel: string;
  ficha: number;
  pend: Record<string, Asignacion>;
  p5sel: string;
  modal: Modal;
}

const initial: AppState = {
  role: "analista",
  screen: "p1",
  state: "normal",
  notes: false,
  logged: true,
  loginState: "normal",
  tg: "Robo",
  dist: "Santiago de Surco",
  vista: "general",
  h: 1,
  metric: "mase",
  busca: "",
  estSel: { local: true, global: true, n1: true, ns: true },
  sort: { col: "distrito", dir: 1 },
  sel: ["Ancón", "Barranco", "Jesús María"],
  onlySel: false,
  p3ej: "EJ-0013",
  p3filtro: "",
  p3dist: "Santiago de Surco",
  trace: null,
  verSel: "v3",
  ficha: 0,
  pend: {},
  p5sel: "EJ-0013",
  modal: null,
};

interface Ctx {
  S: AppState;
  set: (patch: Partial<AppState>) => void;
  toast: string | null;
  showToast: (t: string) => void;
}
const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<AppState>(initial);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number>();
  const set = useCallback((patch: Partial<AppState>) => setS((p) => ({ ...p, ...patch })), []);
  const showToast = useCallback((t: string) => {
    window.clearTimeout(timer.current);
    setToast(t);
    timer.current = window.setTimeout(() => setToast(null), 3800);
  }, []);
  return <AppCtx.Provider value={{ S, set, toast, showToast }}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp fuera de AppProvider");
  return c;
}
