import { useEffect, type ReactNode } from "react";
import { CFG, FICHA, ROLES, SC, SPEC, type Pantalla, type Rol } from "./lib/data";
import { AppProvider, useApp, type LoginState } from "./lib/store";
import { Alert, ILockBig } from "./components/ui";
import P1 from "./screens/P1";
import P2 from "./screens/P2";
import P3 from "./screens/P3";
import P4 from "./screens/P4";
import P5 from "./screens/P5";

const SCREENS: Record<Pantalla, () => ReactNode> = { p1: P1, p2: P2, p3: P3, p4: P4, p5: P5 };

/* ---- Barra de prototipo: cambia rol y estado sin backend ---- */
function DemoBar() {
  const { S, set } = useApp();
  const ok = ROLES[S.role].sc.includes(S.screen);
  const loginStates: [LoginState, string][] = [["normal", "Formulario"], ["error", "Credenciales incorrectas"], ["off", "Cuenta desactivada"], ["exp", "Sesión expirada"]];
  return (
    <div className="demo" role="region" aria-label="Controles del prototipo">
      <strong>Prototipo</strong>
      <label>Rol
        <select value={S.role} onChange={(e) => set({ role: e.target.value as Rol, state: "normal" })}>
          <option value="usuario">Usuario</option><option value="analista">Analista de datos</option><option value="admin">Administrador del sistema</option>
        </select>
      </label>
      <label>Estado de pantalla
        {!S.logged ? (
          <select value={S.loginState} onChange={(e) => set({ loginState: e.target.value as LoginState })}>
            {loginStates.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        ) : ok ? (
          <select value={S.state} onChange={(e) => set({ state: e.target.value, pend: {} })}>
            {SC[S.screen].st.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
          </select>
        ) : (
          <select disabled><option>Permiso denegado</option></select>
        )}
      </label>
      <span className="sp" />
      <button aria-pressed={S.notes} onClick={() => set({ notes: !S.notes })}>Especificación UX</button>
      <button onClick={() => set({ logged: !S.logged, loginState: "normal" })}>{S.logged ? "Ver login" : "Entrar a la app"}</button>
    </div>
  );
}

function Login() {
  const { S, set } = useApp();
  return (
    <div className="login">
      <form className="card stack" style={{ padding: 28 }} onSubmit={(e) => { e.preventDefault(); set({ logged: true, loginState: "normal" }); }}>
        <div className="brand"><i /><span>Plataforma SIDPOL</span></div>
        <div>
          <h1 style={{ fontSize: 20 }}>Iniciar sesión</h1>
          <p className="muted sm" style={{ marginTop: 4 }}>Solo cuentas activas creadas por el administrador del sistema.</p>
        </div>
        {S.loginState === "error" && <Alert kind="er" role="alert"><b>Correo o contraseña incorrectos.</b> Revisa los datos e inténtalo de nuevo.</Alert>}
        {S.loginState === "off" && <Alert kind="wa" role="alert"><b>Esta cuenta está desactivada.</b> Pide al administrador del sistema que la reactive.</Alert>}
        {S.loginState === "exp" && <Alert kind="in" role="status"><b>Tu sesión expiró.</b> Inicia sesión de nuevo para volver a la vista donde estabas.</Alert>}
        <label className="fld"><span className="lbl">Correo</span><input className="inp" type="email" defaultValue="mbarzola@proyecto.pe" autoComplete="username" /></label>
        <label className="fld"><span className="lbl">Contraseña</span><input className="inp" type="password" defaultValue="xxxxxxxxxx" autoComplete="current-password" /></label>
        <button className="btn" type="submit" style={{ justifyContent: "center" }}>Iniciar sesión</button>
      </form>
    </div>
  );
}

function Denied() {
  const { S, set } = useApp();
  const quien = Object.values(ROLES).filter((r) => r.sc.includes(S.screen)).map((r) => r.n).join(" y ");
  const destino = ROLES[S.role].sc[0];
  return (
    <div className="card stack" style={{ maxWidth: 560, margin: "48px auto", padding: 32 }}>
      <span className="muted"><ILockBig /></span>
      <h1 style={{ fontSize: 20 }}>Tu rol no permite abrir “{SC[S.screen].t}”</h1>
      <p className="muted">Esta sección está disponible para {quien}. Tu cuenta tiene el rol {ROLES[S.role].n}. Si necesitas este acceso, pídelo al administrador del sistema.</p>
      <div><button className="btn" onClick={() => set({ screen: destino, state: "normal" })}>Ir a {SC[destino].t}</button></div>
    </div>
  );
}

function Spec({ k }: { k: Pantalla }) {
  const { S } = useApp();
  const n = SPEC[k];
  if (!S.notes || !n) return null;
  const filas = ["Descripción funcional", "Objetivo UX", "Estados críticos", "Decisión de diseño", "Trazabilidad"];
  return (
    <section className="notes" aria-label="Especificación UX">
      <h2>{n[0]}</h2>
      <table><tbody>{filas.map((f, i) => <tr key={f}><td>{f}</td><td>{n[i + 1]}</td></tr>)}</tbody></table>
    </section>
  );
}

function FichaModal() {
  const { S, set } = useApp();
  const i = S.ficha;
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && set({ modal: null })}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Ficha informativa">
        <nav aria-label="Secciones de la ficha">
          {FICHA.map((f, k) => <button key={f[0]} aria-current={k === i} onClick={() => set({ ficha: k })}>{f[0]}</button>)}
        </nav>
        <div className="body">
          <div>
            <button className="x" aria-label="Cerrar" onClick={() => set({ modal: null })}>×</button>
            <p className="muted xs">Ficha informativa</p>
            <h2 style={{ marginTop: 4, fontSize: 18 }}>{FICHA[i][0]}</h2>
          </div>
          <p style={{ lineHeight: 1.65, maxWidth: "62ch" }}>{FICHA[i][1]}</p>
          <div className="row" style={{ marginTop: "auto", justifyContent: "space-between" }}>
            {i > 0 ? <button className="btn sec sm" onClick={() => set({ ficha: i - 1 })}>Anterior</button> : <span />}
            {i < FICHA.length - 1 && <button className="btn sec sm" onClick={() => set({ ficha: i + 1 })}>Siguiente</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmarModal() {
  const { S, set } = useApp();
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && set({ modal: null })}>
      <div className="modal sm" role="dialog" aria-modal="true" aria-label="Confirmar ejecución">
        <h2>¿Iniciar la ejecución?</h2>
        <dl className="ro" style={{ marginTop: -6 }}>
          <dt>Versión de datos</dt><dd>SIDPOL-2026-07 · v1 (íntegra)</dd>
          <dt>Variable objetivo</dt><dd>{S.tg}</dd>
          <dt>Configuración</dt><dd>{CFG.ver} · <span className="hash">{CFG.sha.slice(0, 12)}…</span></dd>
        </dl>
        <p className="muted sm">Se ajustarán Local, Global, naïve-1 y naïve estacional en todos los orígenes de la configuración. Suele tardar entre 10 y 15 minutos.</p>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <button className="btn sec" onClick={() => set({ modal: null })}>Cancelar</button>
          <button className="btn" onClick={() => set({ modal: null, state: "encurso" })}>Iniciar ejecución</button>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { S, set, toast } = useApp();
  const R = ROLES[S.role];
  const ok = R.sc.includes(S.screen);
  const Screen = SCREENS[S.screen];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && set({ modal: null });
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [set]);

  // Cuando cambia el rol, la pantalla activa se mantiene (el prototipo muestra "permiso denegado").
  return (
    <>
      <DemoBar />
      {!S.logged ? (
        <Login />
      ) : (
        <div className="shell">
          <header className="top">
            <div className="brand"><i /><span>Plataforma SIDPOL</span></div>
            <nav className="tabs" aria-label="Secciones">
              {R.sc.map((k) => (
                <button key={k} aria-current={S.screen === k ? "page" : undefined} onClick={() => set({ screen: k, state: "normal" })}>{SC[k].t}</button>
              ))}
            </nav>
            <div className="user"><span>{R.n}</span><i /></div>
          </header>
          <main>
            {ok ? <Screen /> : <Denied />}
            <Spec k={S.screen} />
          </main>
          <footer className="band">
            <span>Los valores corresponden a denuncias registradas en SIDPOL, no a criminalidad real ni a recomendación operativa. Ningún distrito se califica por riesgo o prioridad.</span>
            <button className="btn sec sm" onClick={() => set({ modal: "ficha" })}>Ficha informativa</button>
          </footer>
        </div>
      )}
      {S.modal === "ficha" && <FichaModal />}
      {S.modal === "confirmar" && <ConfirmarModal />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
