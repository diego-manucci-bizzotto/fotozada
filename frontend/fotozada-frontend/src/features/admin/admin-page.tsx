import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto grid max-w-5xl gap-5 p-4"
    >
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Fotozada · Admin
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </motion.header>

      <MetricsCards jobs={list} />

      {settings.data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ControlsForm
            settings={settings.data}
            saving={update.isPending}
            onSave={(v) => update.mutate(v)}
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Fila ao vivo ({active.length})</TabsTrigger>
            <TabsTrigger value="history">Histórico ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <JobTable jobs={active} actions={actions} />
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <JobTable jobs={history} actions={actions} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
