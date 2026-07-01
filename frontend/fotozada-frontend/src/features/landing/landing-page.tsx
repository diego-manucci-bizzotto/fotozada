import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Aperture,
  ArrowRight,
  Briefcase,
  Camera,
  Check,
  Crop,
  Flame,
  Heart,
  Image as ImageIcon,
  PartyPopper,
  Printer,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface Theme {
  id: string;
  name: string;
  tagline: string;
  button: string;
  bg: string;
  accent: string;
  accent2: string;
  text: string;
  sub: string;
  icon: LucideIcon;
}

const THEMES: Theme[] = [
  {
    id: "arraia",
    name: "Arraiá",
    tagline: "Registre os melhores momentos do arraiá",
    button: "Iniciar",
    bg: "linear-gradient(180deg,#1a0a2e,#2d1b4e)",
    accent: "#f59e0b",
    accent2: "#fbbf24",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.6)",
    icon: Flame,
  },
  {
    id: "casamento",
    name: "Casamento",
    tagline: "Para guardar o grande dia",
    button: "Começar",
    bg: "linear-gradient(180deg,#fbf7f4,#f1ddd8)",
    accent: "#b76e79",
    accent2: "#c9a14a",
    text: "#3a2a2a",
    sub: "rgba(58,42,42,0.55)",
    icon: Heart,
  },
  {
    id: "aniversario",
    name: "Aniversário",
    tagline: "A festa em foto, na hora",
    button: "Bora!",
    bg: "linear-gradient(180deg,#5b21b6,#7c3aed)",
    accent: "#ec4899",
    accent2: "#facc15",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.65)",
    icon: PartyPopper,
  },
  {
    id: "corporativo",
    name: "Corporativo",
    tagline: "Sua marca em cada foto",
    button: "Começar",
    bg: "linear-gradient(180deg,#0f172a,#1e293b)",
    accent: "#2563eb",
    accent2: "#38bdf8",
    text: "#ffffff",
    sub: "rgba(255,255,255,0.6)",
    icon: Briefcase,
  },
];

const STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Sparkles, title: "Boas-vindas", desc: "A tela recebe o convidado com a cara do evento." },
  { icon: ImageIcon, title: "Formato", desc: "Foto 10×15, tirinha ou o layout do tema." },
  { icon: Camera, title: "Foto", desc: "Escolhe da galeria e enquadra na hora." },
  { icon: Crop, title: "Revisão", desc: "Confere o resultado antes de imprimir." },
  { icon: Printer, title: "Impressão", desc: "Sai na mão em segundos, fila ao vivo." },
];

const SPECS = ["10×15 cm", "300 DPI", "Impressão na hora", "Fila ao vivo", "Tema sob medida"];

interface CaseItem {
  event: string;
  meta: string;
  themeId: string;
  src?: string;
}

// Trocar pelos cases reais. Para mostrar a foto, salve em public/cases/<arquivo>.jpg
// e preencha `src` (ex: "/cases/arraia-unaerp.jpg").
const CASES: CaseItem[] = [
  { event: "Arraiá da UNAERP", meta: "Jun 2026 · Ribeirão Preto", themeId: "arraia" },
  { event: "Marina & Téo", meta: "Mar 2026 · Casamento", themeId: "casamento" },
  { event: "15 anos da Sofia", meta: "Fev 2026 · Aniversário", themeId: "aniversario" },
  { event: "Acme Tech Summit", meta: "Nov 2025 · Corporativo", themeId: "corporativo" },
  { event: "São João do Sesc", meta: "Jun 2025 · Festa junina", themeId: "arraia" },
  { event: "Confra Vertex", meta: "Dez 2025 · Fim de ano", themeId: "corporativo" },
];

const ROT = ["-rotate-3", "rotate-2", "-rotate-2", "rotate-3", "-rotate-1", "rotate-2"];
const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

function ThemeDecoration({ theme }: { theme: Theme }) {
  if (theme.id === "arraia") {
    return (
      <svg viewBox="0 0 200 28" className="w-full" preserveAspectRatio="none">
        <line x1="0" y1="4" x2="200" y2="4" stroke={theme.accent2} strokeWidth="1.5" />
        {Array.from({ length: 11 }).map((_, i) => (
          <path
            key={i}
            d={`M${i * 20} 4 L${i * 20 + 10} 20 L${i * 20 + 20} 4 Z`}
            fill={i % 2 ? theme.accent : theme.accent2}
            opacity="0.9"
          />
        ))}
      </svg>
    );
  }
  if (theme.id === "aniversario") {
    const dots = [
      [18, 8, "#facc15"], [40, 18, "#ec4899"], [70, 6, "#38bdf8"], [100, 16, "#facc15"],
      [130, 8, "#ec4899"], [160, 18, "#38bdf8"], [182, 6, "#facc15"],
    ] as const;
    return (
      <svg viewBox="0 0 200 28" className="w-full" preserveAspectRatio="none">
        {dots.map(([x, y, c], i) =>
          i % 2 ? (
            <rect key={i} x={x} y={y} width="5" height="5" rx="1" fill={c} transform={`rotate(20 ${x} ${y})`} />
          ) : (
            <circle key={i} cx={x} cy={y} r="3" fill={c} />
          ),
        )}
      </svg>
    );
  }
  if (theme.id === "casamento") {
    return (
      <svg viewBox="0 0 200 28" className="w-full" preserveAspectRatio="none">
        <circle cx="92" cy="14" r="9" fill="none" stroke={theme.accent2} strokeWidth="2" />
        <circle cx="108" cy="14" r="9" fill="none" stroke={theme.accent} strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 28" className="w-full" preserveAspectRatio="none">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={70 + i * 22} y="10" width="14" height="14" rx="3" fill={i === 1 ? theme.accent : theme.accent2} opacity={i === 1 ? 1 : 0.4} />
      ))}
    </svg>
  );
}

function DevicePreview({ theme }: { theme: Theme }) {
  const Icon = theme.icon;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[1.6rem] px-6 py-8"
        style={{ background: theme.bg }}
      >
        <div className="w-full">
          <ThemeDecoration theme={theme} />
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${theme.accent}26` }}
          >
            <Icon className="h-7 w-7" style={{ color: theme.accent2 }} />
          </span>
          <span className="lp-display text-2xl font-black tracking-tight" style={{ color: theme.text }}>
            fotozada
          </span>
          <span className="lp-body max-w-[14rem] text-sm leading-snug" style={{ color: theme.sub }}>
            {theme.tagline}
          </span>
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <span
            className="lp-display rounded-xl px-8 py-3 text-sm font-extrabold text-white shadow-lg"
            style={{ backgroundColor: theme.accent, boxShadow: `0 10px 30px -10px ${theme.accent}` }}
          >
            {theme.button}
          </span>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="h-1.5 rounded-full"
                style={{
                  width: i === 0 ? 22 : 6,
                  backgroundColor: i === 0 ? theme.accent : `${theme.text}40`,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function PrintCard({ c, i }: { c: CaseItem; i: number }) {
  const t = themeById(c.themeId);
  const Icon = t.icon;
  return (
    <figure className="group relative">
      <div
        className={`relative rounded-sm bg-white p-3 pb-14 shadow-xl shadow-black/10 transition-transform duration-300 ${ROT[i % ROT.length]} group-hover:-translate-y-1.5 group-hover:rotate-0`}
      >
        {/* fita */}
        <span className="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 -rotate-3 rounded-[1px] bg-white/55 shadow-sm ring-1 ring-black/5 backdrop-blur-[1px]" />
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm" style={{ background: t.bg }}>
          <div className="absolute inset-x-0 top-0 opacity-90">
            <ThemeDecoration theme={t} />
          </div>
          <Icon
            className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2"
            style={{ color: t.text, opacity: 0.16 }}
          />
          {c.src && (
            <img src={c.src} alt={c.event} className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <figcaption className="absolute inset-x-3 bottom-3.5">
          <p className="lp-display text-base font-extrabold leading-tight text-[#1a1a1a]">{c.event}</p>
          <p className="lp-mono mt-0.5 text-[11px] uppercase tracking-wide text-[#9ca3af]">{c.meta}</p>
        </figcaption>
      </div>
    </figure>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 11 L7 7 L11 7" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 11 L25 7 L21 7" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M7 21 L7 25 L11 25" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M25 21 L25 25 L21 25" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="#f43f5e" />
      </svg>
      <span className="lp-display text-lg font-black tracking-tight text-[#1a1a1a]">fotozada</span>
    </span>
  );
}

export function LandingPage() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const theme = THEMES[active];

  useEffect(() => {
    if (paused || reduce) return;
    const id = setInterval(() => setActive((a) => (a + 1) % THEMES.length), 3500);
    return () => clearInterval(id);
  }, [paused, reduce]);

  return (
    <div className="lp-body min-h-svh bg-white text-[#1a1a1a] antialiased">
      <style>{`
        .lp-body { font-family: 'Hanken Grotesk', system-ui, sans-serif; }
        .lp-display { font-family: 'Nunito', system-ui, sans-serif; }
        .lp-mono { font-family: 'Space Mono', ui-monospace, monospace; }
        .lp-focus:focus-visible { outline: 2px solid #f43f5e; outline-offset: 3px; border-radius: 4px; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-black/8 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Wordmark />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#fluxo" className="lp-focus text-sm text-[#6b7280] transition-colors hover:text-[#1a1a1a]">Como funciona</a>
            <a href="#temas" className="lp-focus text-sm text-[#6b7280] transition-colors hover:text-[#1a1a1a]">Temas</a>
            <a href="#cases" className="lp-focus text-sm text-[#6b7280] transition-colors hover:text-[#1a1a1a]">Cases</a>
            <a href="#contato" className="lp-focus rounded-full bg-[#1a1a1a] px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
              Agendar evento
            </a>
          </nav>
          <a href="#contato" className="lp-focus rounded-full bg-[#1a1a1a] px-4 py-2 text-sm font-semibold text-white md:hidden">
            Agendar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          {/* Left */}
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lp-mono mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#6b7280]"
            >
              <Aperture className="h-4 w-4 text-[#f43f5e]" />
              Fotos impressas na hora
            </motion.p>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="lp-display text-5xl font-black leading-[0.95] tracking-tight md:text-6xl"
            >
              A sua festa,
              <br />
              <span className="relative inline-block">
                impressa
                <span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-[#f43f5e]" />
              </span>{" "}
              na hora.
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-6 max-w-md text-lg leading-relaxed text-[#6b7280]"
            >
              Um totem de fotos que veste a identidade do seu evento — do clique
              na tela à recordação impressa na mão do convidado.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a href="#contato" className="lp-focus group flex items-center gap-2 rounded-full bg-[#1a1a1a] px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]">
                Agendar evento
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link to="/arraial" className="lp-focus rounded-full border border-black/15 px-6 py-3.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-black/5">
                Ver demo ao vivo
              </Link>
            </motion.div>

            {/* Theme switcher */}
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.28 }}
              className="mt-10"
            >
              <p className="lp-mono mb-3 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Experiência</p>
              <div className="flex flex-wrap gap-2">
                {THEMES.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActive(i);
                      setPaused(true);
                    }}
                    className={`lp-focus rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      i === active
                        ? "border-transparent bg-[#1a1a1a] text-white"
                        : "border-black/15 text-[#6b7280] hover:border-black/30"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — framed live preview */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div className="relative" style={{ width: 300 }}>
              {/* Viewfinder brackets */}
              {[
                "top-0 left-0 border-l-[3px] border-t-[3px] rounded-tl-lg",
                "top-0 right-0 border-r-[3px] border-t-[3px] rounded-tr-lg",
                "bottom-0 left-0 border-l-[3px] border-b-[3px] rounded-bl-lg",
                "bottom-0 right-0 border-r-[3px] border-b-[3px] rounded-br-lg",
              ].map((pos, i) => (
                <span
                  key={i}
                  className={`pointer-events-none absolute z-20 h-7 w-7 ${pos}`}
                  style={{ borderColor: theme.accent, margin: -14, transition: "border-color 0.4s" }}
                />
              ))}

              {/* Device */}
              <div className="relative aspect-[3/4.6] w-full overflow-hidden rounded-[1.6rem] border border-black/10 bg-black shadow-2xl shadow-black/20">
                <DevicePreview theme={theme} />
                {/* Shutter flash on each theme switch */}
                {!reduce && (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0.85 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="pointer-events-none absolute inset-0 z-30 bg-white"
                  />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Specs HUD strip */}
        <div className="border-y border-black/8 bg-[#fafafa]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-7 gap-y-2 px-5 py-3.5">
            {SPECS.map((s) => (
              <span key={s} className="lp-mono flex items-center gap-2 text-xs uppercase tracking-wider text-[#6b7280]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f43f5e]" />
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="fluxo" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20 md:py-28">
        <Reveal>
          <p className="lp-mono mb-3 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Fluxo</p>
          <h2 className="lp-display max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Do toque à foto na mão, em cinco passos.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="group relative h-full rounded-2xl border border-black/8 bg-white p-5 transition-colors hover:border-black/20">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a1a1a] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="lp-mono text-sm text-[#d1d5db]">0{i + 1}</span>
                  </div>
                  <h3 className="lp-display text-lg font-extrabold">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6b7280]">{step.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Temas */}
      <section id="temas" className="scroll-mt-20 border-t border-black/8 bg-[#fafafa] py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <p className="lp-mono mb-3 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Temas</p>
            <h2 className="lp-display max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Cada evento é um mundo. O totem entra em todos.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-[#6b7280]">
              Levamos a paleta, os personagens e o clima da sua festa para dentro da tela.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {THEMES.map((t, i) => {
              const Icon = t.icon;
              return (
                <Reveal key={t.id} delay={i * 0.08}>
                  <div className="group relative overflow-hidden rounded-2xl p-6" style={{ background: t.bg, minHeight: 220 }}>
                    {[
                      "top-3 left-3 border-l-2 border-t-2 rounded-tl",
                      "top-3 right-3 border-r-2 border-t-2 rounded-tr",
                      "bottom-3 left-3 border-l-2 border-b-2 rounded-bl",
                      "bottom-3 right-3 border-r-2 border-b-2 rounded-br",
                    ].map((pos, j) => (
                      <span key={j} className={`pointer-events-none absolute h-5 w-5 ${pos}`} style={{ borderColor: t.accent }} />
                    ))}
                    <div className="flex h-full flex-col justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${t.accent}26` }}>
                        <Icon className="h-6 w-6" style={{ color: t.accent2 }} />
                      </span>
                      <div>
                        <h3 className="lp-display text-xl font-extrabold" style={{ color: t.text }}>{t.name}</h3>
                        <p className="mt-1 text-sm leading-snug" style={{ color: t.sub }}>{t.tagline}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.1}>
            <p className="lp-mono mt-8 text-sm text-[#9ca3af]">
              Não achou o seu? A gente cria o tema do zero.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Cases — parede de fotos dos eventos */}
      <section id="cases" className="scroll-mt-20 px-5 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="lp-mono mb-3 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Cases</p>
            <h2 className="lp-display max-w-2xl text-4xl font-black leading-tight tracking-tight md:text-5xl">
              Festas que já levaram a foto pra casa.
            </h2>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
              {["+40 eventos", "+6.000 fotos impressas", "100% na hora"].map((s) => (
                <span key={s} className="lp-mono flex items-center gap-2 text-sm text-[#6b7280]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f43f5e]" />
                  {s}
                </span>
              ))}
            </div>
          </Reveal>

          <div className="mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {CASES.map((c, i) => (
              <Reveal key={c.event} delay={(i % 3) * 0.08}>
                <PrintCard c={c} i={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / contato */}
      <section id="contato" className="scroll-mt-20 border-t border-black/8 px-5 py-24 md:py-32">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f43f5e]/10">
            <Aperture className="h-6 w-6 text-[#f43f5e]" />
          </span>
          <h2 className="lp-display text-4xl font-black leading-tight tracking-tight md:text-5xl">
            Vamos montar o totem da sua festa?
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-[#6b7280]">
            Conta a data e o tema do evento. A experiência a gente cria.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:contato@fotozada.com.br" className="lp-focus group flex items-center gap-2 rounded-full bg-[#1a1a1a] px-7 py-4 text-base font-semibold text-white transition-transform hover:scale-[1.03]">
              Agendar evento
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link to="/arraial" className="lp-focus flex items-center gap-2 rounded-full border border-black/15 px-7 py-4 text-base font-semibold text-[#1a1a1a] transition-colors hover:bg-black/5">
              <Check className="h-4 w-4 text-[#f43f5e]" />
              Ver demo do Arraiá
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/8 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Wordmark />
          <div className="flex items-center gap-6">
            <Link to="/" className="lp-focus text-sm text-[#6b7280] hover:text-[#1a1a1a]">Início</Link>
            <Link to="/arraial" className="lp-focus text-sm text-[#6b7280] hover:text-[#1a1a1a]">Demo</Link>
            <span className="lp-mono text-xs text-[#9ca3af]">© 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
