import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useAuth } from "./hooks/use-auth";
import { useAdminJobs } from "./hooks/use-admin-jobs";
import { useAdminSettings } from "./hooks/use-admin-settings";
import { useJobActions } from "./hooks/use-job-actions";
import { LoginForm } from "./components/login-form";
import { MetricsCards } from "./components/metrics-cards";
import { ControlsForm } from "./components/controls-form";
import { JobTable } from "./components/job-table";

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4 text-muted-foreground">
      {children}
    </div>
  );
}

export function AdminPage() {
  const { session, loading, isAdmin, checkingAdmin } = useAuth();

  if (loading) return <Centered>Carregando…</Centered>;
  if (!session) return <LoginForm />;
  if (checkingAdmin) return <Centered>Verificando acesso…</Centered>;
  if (!isAdmin) {
    return (
      <Centered>
        <div className="text-center">
          <p>{session.user.email} não tem acesso ao admin.</p>
          <Button variant="link" onClick={() => supabase.auth.signOut()}>
            Sair
          </Button>
        </div>
      </Centered>
    );
  }
  return <Dashboard />;
}

function Dashboard() {
  const jobs = useAdminJobs();
  const { query: settings, update } = useAdminSettings();
  const actions = useJobActions();

  const list = jobs.data ?? [];
  const active = list.filter((j) => j.status === "queued" || j.status === "printing");
  const history = list.filter((j) => !["queued", "printing"].includes(j.status));

  return (
    <div className="mx-auto grid max-w-5xl gap-5 p-4">
      <header className="flex items-center justify-between">
        <span className="text-lg font-semibold text-primary">Fotozada · Admin</span>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
          Sair
        </Button>
      </header>

      <MetricsCards jobs={list} />

      {settings.data && (
        <ControlsForm
          settings={settings.data}
          saving={update.isPending}
          onSave={(v) => update.mutate(v)}
          onSimulate={() => actions.simulate.mutate()}
        />
      )}

      <h2 className="text-base font-semibold">Fila ao vivo</h2>
      <JobTable jobs={active} actions={actions} />

      <h2 className="text-base font-semibold">Histórico</h2>
      <JobTable jobs={history} actions={actions} />
    </div>
  );
}
