import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { LAYOUTS } from "../lib/layouts";
import type { JobStatus, LayoutId } from "../lib/types";

interface Batch {
  id: string;
  device_id: string;
  ip: string | null;
  user_agent: string | null;
  total_sheets: number;
  created_at: string;
}

interface Job {
  id: string;
  batch_id: string;
  idx: number;
  layout: LayoutId;
  copies: number;
  composed_path: string;
  status: JobStatus;
  error: string | null;
  device_id: string;
  created_at: string;
  printing_at: string | null;
  printed_at: string | null;
  print_ms: number | null;
  print_batches?: Batch | null;
}

interface Settings {
  kiosk_id: string;
  queue_paused: boolean;
  require_approval: boolean;
  max_sheets_per_batch: number;
}

const KIOSK = "kiosk-01";

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    supabase.rpc("is_admin").then(({ data }) => {
      if (active) setIsAdmin(Boolean(data));
    });
    return () => {
      active = false;
    };
  }, [session]);

  if (checking) return <div className="page admin">Carregando…</div>;
  if (!session) return <Login />;
  if (isAdmin === null) return <div className="page admin">Verificando acesso…</div>;
  if (!isAdmin) return <NotAdmin email={session.user.email ?? ""} />;
  return <Dashboard />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  }

  return (
    <div className="page admin">
      <header className="topbar">
        <strong>Fotozada · Admin</strong>
        <Link className="admin-link" to="/">
          Kiosk
        </Link>
      </header>
      <form className="card login" onSubmit={submit}>
        <h2>Entrar</h2>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="message">{err}</p>}
        <button className="primary" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function NotAdmin({ email }: { email: string }) {
  return (
    <div className="page admin">
      <div className="card">
        <h2>Sem acesso</h2>
        <p className="muted">
          {email} não está na lista de administradores. Adicione este usuário à tabela
          <code> admins</code> no Supabase.
        </p>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function loadJobs() {
    const { data } = await supabase
      .from("print_jobs")
      .select("*, print_batches(*)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (data) setJobs(data as unknown as Job[]);
  }

  async function loadSettings() {
    const { data } = await supabase
      .from("kiosk_settings")
      .select("kiosk_id, queue_paused, require_approval, max_sheets_per_batch")
      .eq("kiosk_id", KIOSK)
      .single();
    if (data) setSettings(data as Settings);
  }

  useEffect(() => {
    const channel = supabase
      .channel("admin-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "print_jobs" }, () =>
        loadJobs(),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          loadJobs();
          loadSettings();
        }
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function patchSettings(patch: Partial<Settings>) {
    if (!settings) return;
    setSettings({ ...settings, ...patch });
    await supabase.from("kiosk_settings").update(patch).eq("kiosk_id", KIOSK);
  }

  async function setStatus(id: string, status: JobStatus) {
    await supabase.from("print_jobs").update({ status }).eq("id", id);
    loadJobs();
  }

  async function reprint(id: string) {
    await supabase.rpc("admin_reprint_job", { p_job_id: id });
    loadJobs();
  }

  async function simulateNow() {
    await supabase.functions.invoke("simulate-printer", { body: { kiosk_id: KIOSK } });
    loadJobs();
  }

  async function showPreview(path: string) {
    const { data } = await supabase.storage.from("prints").createSignedUrl(path, 60);
    if (data?.signedUrl) setPreview(data.signedUrl);
  }

  const m = computeMetrics(jobs);
  const active = jobs.filter((j) => j.status === "queued" || j.status === "printing");
  const history = jobs.filter((j) => !["queued", "printing"].includes(j.status));

  return (
    <div className="page admin wide">
      <header className="topbar">
        <strong>Fotozada · Admin</strong>
        <div className="row">
          <Link className="admin-link" to="/">
            Kiosk
          </Link>
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Sair
          </button>
        </div>
      </header>

      <section className="metrics">
        <Metric label="Folhas hoje" value={m.sheetsToday} />
        <Metric label="Na fila / imprimindo" value={active.length} />
        <Metric label="Taxa de sucesso" value={m.successRate} />
        <Metric label="Tempo médio" value={m.avgMs} />
        <Metric label="10x15 / tirinha" value={`${m.single} / ${m.strip}`} />
      </section>

      {settings && (
        <section className="card controls">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.queue_paused}
              onChange={(e) => patchSettings({ queue_paused: e.target.checked })}
            />
            Fila pausada
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.require_approval}
              onChange={(e) => patchSettings({ require_approval: e.target.checked })}
            />
            Exigir aprovação
          </label>
          <label className="num">
            Máx folhas / envio
            <input
              type="number"
              min={1}
              value={settings.max_sheets_per_batch}
              onChange={(e) =>
                patchSettings({ max_sheets_per_batch: Math.max(1, Number(e.target.value)) })
              }
            />
          </label>
          <button className="link" onClick={simulateNow}>
            Simular agora
          </button>
        </section>
      )}

      <h2 className="section-title">Fila ao vivo</h2>
      <JobTable jobs={active} onStatus={setStatus} onReprint={reprint} onPreview={showPreview} />

      <h2 className="section-title">Histórico</h2>
      <JobTable jobs={history} onStatus={setStatus} onReprint={reprint} onPreview={showPreview} />

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  );
}

function JobTable({
  jobs,
  onStatus,
  onReprint,
  onPreview,
}: {
  jobs: Job[];
  onStatus: (id: string, s: JobStatus) => void;
  onReprint: (id: string) => void;
  onPreview: (path: string) => void;
}) {
  if (jobs.length === 0) return <p className="muted empty">Nada aqui.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Quando</th>
            <th>Layout</th>
            <th>Cópias</th>
            <th>Status</th>
            <th>Device</th>
            <th>Duração</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} className={`st-${j.status}`}>
              <td>{new Date(j.created_at).toLocaleTimeString()}</td>
              <td>{LAYOUTS[j.layout]?.label ?? j.layout}</td>
              <td>{j.copies}</td>
              <td>{j.status}</td>
              <td title={j.device_id}>{j.device_id.slice(0, 8)}</td>
              <td>{j.print_ms ? `${j.print_ms} ms` : "—"}</td>
              <td className="actions">
                <button className="link" onClick={() => onPreview(j.composed_path)}>
                  Ver
                </button>
                {j.status === "pending_approval" && (
                  <button className="link" onClick={() => onStatus(j.id, "queued")}>
                    Aprovar
                  </button>
                )}
                {j.status !== "done" && j.status !== "canceled" && (
                  <button className="link danger" onClick={() => onStatus(j.id, "canceled")}>
                    Cancelar
                  </button>
                )}
                <button className="link" onClick={() => onReprint(j.id)}>
                  Reimprimir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function computeMetrics(jobs: Job[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = jobs.filter((j) => new Date(j.created_at) >= startOfToday);
  const sheetsToday = today.reduce((s, j) => s + j.copies, 0);
  const done = jobs.filter((j) => j.status === "done");
  const errored = jobs.filter((j) => j.status === "error");
  const finished = done.length + errored.length;
  const successRate = finished ? `${Math.round((done.length / finished) * 100)}%` : "—";
  const durations = done.map((j) => j.print_ms ?? 0).filter((n) => n > 0);
  const avgMs = durations.length
    ? `${Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)} ms`
    : "—";
  const single = jobs.filter((j) => j.layout === "single_10x15").length;
  const strip = jobs.filter((j) => j.layout === "strip_3").length;
  return { sheetsToday, successRate, avgMs, single, strip };
}
