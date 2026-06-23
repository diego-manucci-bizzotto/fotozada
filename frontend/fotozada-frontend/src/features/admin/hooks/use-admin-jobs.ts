import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Job } from "../types";

const KEY = ["admin", "jobs"];

async function fetchJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("print_jobs")
    .select("*, print_batches(*)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as Job[];
}

export function useAdminJobs() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: fetchJobs });

  useEffect(() => {
    const channel = supabase
      .channel("admin-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "print_jobs" },
        () => qc.invalidateQueries({ queryKey: KEY }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
