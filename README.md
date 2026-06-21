# Fotozada — impressão de fotos via QR code

Web app de kiosk: o usuário escaneia um QR, abre o site no celular, monta um
**carrinho** de fotos (10x15 e/ou tirinha de 3), recorta, vê o preview e envia
para a fila de impressão. Esta fase entrega **site + banco + backend** rodando
no free tier de **Vercel** + **Supabase**. A impressora física (Raspberry Pi)
ainda **não** faz parte: um *worker simulado* avança os jobs para podermos testar
tudo de ponta a ponta.

```
[Celular] --(QR)--> [Vercel: Vite+React SPA]
     |  request-upload / create-print-job (Edge Functions, service role)
     v
[Supabase] Postgres + Storage(prints) + Realtime + Auth
     |  pg_cron -> tick_simulated_printer()  (faz o papel do Pi)
     v
status do usuário via Realtime Broadcast  •  /admin via Auth + postgres_changes
```

## Estrutura

```
backend/supabase/        # CLI do Supabase: migrations + edge functions
  migrations/            # schema, RLS, storage, RPCs, broadcast, cron
  functions/             # request-upload, create-print-job, simulate-printer
frontend/fotozada-frontend/   # Vite + React 19 + TS (SPA, deploy na Vercel)
```

## Modelo de dados

- **print_batches** — um envio (carrinho). `client_request_id` único = idempotência.
  `total_sheets` = Σ copies, validado `<= max_sheets_per_batch`.
- **print_jobs** — um item do carrinho = **uma folha composta** (impressa `copies` vezes).
  É o que o "Pi"/simulador processa (`queued → printing → done`).
- **print_job_photos** — fotos de origem recortadas (1 p/ 10x15, 3 p/ tirinha).
- **kiosk_settings** — `queue_paused`, `require_approval`, `max_sheets_per_batch` (default 5),
  `layout_config`. **Único throttle é o limite de folhas por lote** (sem cooldown/quota/dedupe).
- **admins** — usuários (auth.users) que podem entrar no `/admin`.

## Segurança

- `anon` **não** escreve em nenhuma tabela de impressão nem no Storage diretamente.
  Tudo passa pelas Edge Functions, que usam a **service role key** (só no Supabase).
- Uploads acontecem por **signed upload URLs** geradas pela `request-upload`.
- `create-print-job` é o ponto único de controle: idempotência + limite de folhas.
- Status do usuário vai por **Realtime Broadcast** no canal `batch-status:<batch_id>`
  (o uuid do lote é a capability) — anon nunca recebe SELECT na tabela.
- `/admin` é Supabase Auth; só vê dados quem está em `public.admins` (RLS).

---

## Setup

### Pré-requisitos
- Conta Supabase (free) e conta Vercel.
- Supabase CLI: use `npx supabase ...` (sem instalar) ou `npm i -g supabase` / `scoop install supabase`.

### 1) Supabase

```bash
# a partir de backend/  (onde está a pasta supabase/)
cd backend

# vincular ao projeto criado no painel (pega o ref em Project Settings > General)
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF

# aplicar todas as migrations (schema, RLS, storage, RPCs, broadcast, cron)
npx supabase db push

# publicar as Edge Functions
npx supabase functions deploy request-upload
npx supabase functions deploy create-print-job
npx supabase functions deploy simulate-printer
```

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no ambiente das functions —
nada a configurar manualmente.

Se o `db push` reclamar do `pg_cron`/`pg_net`, habilite **pg_cron** (e, se quiser,
pg_net) em *Database → Extensions* no painel e rode de novo só os `select cron.schedule(...)`
do arquivo `migrations/20260621000006_realtime_cron.sql`.

### 2) Primeiro admin

1. No painel: *Authentication → Users → Add user* (email + senha; confirme o email).
2. Copie o **User UID** e rode em *SQL Editor*:
   ```sql
   insert into public.admins (user_id) values ('UID_DO_USUARIO');
   ```
3. Esse login agora acessa `/admin`.

### 3) Frontend (Vercel)

Variáveis (públicas) — `frontend/fotozada-frontend/.env.example`:

```
VITE_SUPABASE_URL=https://SEU_REF.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

- **Local:** copie para `.env.local` e rode:
  ```bash
  npm install --prefix frontend/fotozada-frontend
  npm run dev --prefix frontend/fotozada-frontend
  ```
- **Deploy:** importe o diretório `frontend/fotozada-frontend` na Vercel (preset Vite),
  defina as duas envs acima. O `vercel.json` já faz o rewrite SPA para `/admin`.

### 4) QR code

Gere um QR estático (qualquer gerador) apontando para:
`https://SEU-APP.vercel.app/?kiosk=kiosk-01`

---

## Worker simulado (no lugar do Raspberry Pi)

`tick_simulated_printer()` (SQL, SECURITY DEFINER) é agendada pelo **pg_cron a cada 6s**:
finaliza qualquer job em `printing` há ≥2s e, se a fila não estiver pausada, pega o
próximo `queued` → `printing`. A Edge Function `simulate-printer` chama o mesmo RPC e
está ligada ao botão **"Simular agora"** do admin.

**Para ir ao vivo com a impressora:** desligue o cron
(`select cron.unschedule('fotozada-printer-tick');`) e suba o worker do Pi assinando
`status = queued` (CUPS/`lp`), marcando `printing`/`done` — o resto (front, admin,
broadcast) continua igual.

## Verificação rápida

- **Limite de lote:** 2×10x15 + 3×tirinha (5 folhas) passa; tentar a 6ª é bloqueado (UI e backend).
- **Idempotência:** reenviar o mesmo lote não duplica (mesmo `client_request_id`).
- **Fluxo:** carrinho → Imprimir → status anda `Na fila → Imprimindo → Pronto!` (via simulador).
- **Admin:** pausar fila trava o avanço; ligar aprovação deixa jobs em `pending_approval`;
  aprovar/cancelar/reimprimir funcionam; métricas batem; "Ver" abre o preview por signed URL.

## Limitações desta fase
- Sem impressora real (worker simulado no lugar do Pi).
- A limpeza horária (`pg_cron`) remove **linhas** antigas; objetos do Storage de lotes
  antigos não são apagados aqui (fica para um job de storage-cleanup posterior).
```
