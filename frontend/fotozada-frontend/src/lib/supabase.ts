import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anon) {
  // Surfaced loudly in dev; in prod the app simply can't talk to the backend.
  console.warn(
    "[fotozada] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.",
  );
}

export const supabase = createClient(url ?? "", anon ?? "");
