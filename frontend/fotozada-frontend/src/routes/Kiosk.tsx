import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { newId } from "../lib/device";
import { submitBatch } from "../lib/api";
import { LAYOUTS, LAYOUT_LIST } from "../lib/layouts";
import type { CartItem, JobStatus, LayoutDef } from "../lib/types";
import PhotoEditor from "../components/PhotoEditor";
import BatchStatus from "../components/BatchStatus";

type Mode = "browse" | "editing" | "status";

interface Result {
  batchId: string;
  jobIds: string[];
  status: JobStatus;
  items: CartItem[];
}

export default function Kiosk() {
  const kioskId = useMemo(
    () => new URLSearchParams(window.location.search).get("kiosk") ?? "kiosk-01",
    [],
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [maxSheets, setMaxSheets] = useState(5);
  const [mode, setMode] = useState<Mode>("browse");
  const [editLayout, setEditLayout] = useState<LayoutDef | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const requestIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase
      .from("kiosk_settings")
      .select("max_sheets_per_batch")
      .eq("kiosk_id", kioskId)
      .single()
      .then(({ data }) => {
        if (data?.max_sheets_per_batch) setMaxSheets(data.max_sheets_per_batch);
      });
  }, [kioskId]);

  const cartSheets = cart.reduce((s, i) => s + i.copies, 0);
  const remaining = maxSheets - cartSheets;

  function startAdd(layout: LayoutDef) {
    if (remaining < 1) {
      setMessage(`Limite de ${maxSheets} folhas por envio atingido.`);
      return;
    }
    setMessage(null);
    setEditLayout(layout);
    setMode("editing");
  }

  function addItem(item: CartItem) {
    setCart((c) => [...c, item]);
    setEditLayout(null);
    setMode("browse");
  }

  function removeItem(id: string) {
    setCart((c) => {
      const item = c.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.composedUrl);
      return c.filter((i) => i.id !== id);
    });
  }

  async function doSubmit() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setMessage(null);
    if (!requestIdRef.current) requestIdRef.current = newId();
    try {
      const res = await submitBatch(kioskId, cart, requestIdRef.current);
      if (res.blocked) {
        setMessage(`Limite de ${res.max} folhas por envio — você pediu ${res.requested}.`);
        return;
      }
      if (res.error) {
        setMessage("Erro: " + res.error);
        return;
      }
      if (res.batch_id && res.job_ids) {
        setResult({
          batchId: res.batch_id,
          jobIds: res.job_ids,
          status: (res.status as JobStatus) ?? "queued",
          items: cart,
        });
        setMode("status");
      }
    } catch (e) {
      setMessage("Falha ao enviar: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  }

  function newOrder() {
    cart.forEach((i) => URL.revokeObjectURL(i.composedUrl));
    setCart([]);
    setResult(null);
    requestIdRef.current = null;
    setMessage(null);
    setMode("browse");
  }

  return (
    <div className="page">
      <header className="topbar">
        <strong>Fotozada</strong>
        <Link className="admin-link" to="/admin">
          Admin
        </Link>
      </header>

      {mode === "status" && result ? (
        <BatchStatus
          batchId={result.batchId}
          jobIds={result.jobIds}
          items={result.items}
          initialStatus={result.status}
          onNew={newOrder}
        />
      ) : mode === "editing" && editLayout ? (
        <PhotoEditor
          layout={editLayout}
          remainingSheets={remaining}
          onAdd={addItem}
          onCancel={() => {
            setEditLayout(null);
            setMode("browse");
          }}
        />
      ) : (
        <>
          <section className="card">
            <div className="counter-bar">
              <span>Seu carrinho</span>
              <span className={remaining <= 0 ? "warn" : "muted"}>
                {cartSheets} / {maxSheets} folhas
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="muted empty">Nenhuma foto ainda. Adicione abaixo.</p>
            ) : (
              <ul className="cart-list">
                {cart.map((it, i) => (
                  <li key={it.id}>
                    <img src={it.composedUrl} alt="" className="thumb" />
                    <span>
                      {i + 1}. {LAYOUTS[it.layout].label} ×{it.copies}
                    </span>
                    <button className="link danger" onClick={() => removeItem(it.id)}>
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <p className="muted">Adicionar ao carrinho</p>
            <div className="layout-buttons">
              {LAYOUT_LIST.map((l) => (
                <button
                  key={l.id}
                  className="layout-btn"
                  disabled={remaining < 1}
                  onClick={() => startAdd(l)}
                >
                  <strong>{l.label}</strong>
                  <span className="muted">
                    {l.photos} foto{l.photos > 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {message && <p className="message">{message}</p>}

          <button
            className="primary submit"
            disabled={cart.length === 0 || submitting}
            onClick={doSubmit}
          >
            {submitting ? "Enviando…" : `Imprimir (${cartSheets} folha${cartSheets === 1 ? "" : "s"})`}
          </button>
        </>
      )}
    </div>
  );
}
