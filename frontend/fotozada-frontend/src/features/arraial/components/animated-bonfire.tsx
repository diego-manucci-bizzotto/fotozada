import { useEffect, useRef } from "react";

const FLAME_DEFS: [number, number, number, number, number, number, number, boolean][] = [
  [52, 80, 70, 250, 36, 2.7, 0.0, false],
  [44, 79, 40, 165, 32, 2.1, 0.5, false],
  [60, 80, 44, 180, 40, 2.3, 0.9, false],
  [50, 81, 26, 135, 48, 1.7, 0.3, true],
  [38, 82, 22, 95, 30, 1.9, 1.1, false],
  [66, 81, 26, 110, 37, 2.0, 0.7, false],
  [55, 82, 16, 80, 52, 1.5, 0.2, true],
];

function flamePath(w: number, h: number, wob: number) {
  const c = (v: number) => v.toFixed(1);
  return (
    `M0 0 ` +
    `C ${c(-w / 2)} ${c(-h * 0.26)} ${c(-w * 0.7 + wob)} ${c(-h * 0.55)} ${c(-w * 0.12 + wob)} ${c(-h * 0.78)} ` +
    `C ${c(-w * 0.06 + wob * 1.4)} ${c(-h * 0.9)} ${c(wob * 1.4)} ${c(-h * 0.97)} 0 ${c(-h)} ` +
    `C ${c(-wob * 1.4)} ${c(-h * 0.97)} ${c(w * 0.06 - wob * 1.4)} ${c(-h * 0.9)} ${c(w * 0.12 - wob)} ${c(-h * 0.78)} ` +
    `C ${c(w * 0.7 - wob)} ${c(-h * 0.55)} ${c(w / 2)} ${c(-h * 0.26)} 0 0 Z`
  );
}

function Flames() {
  return (
    <div className="absolute inset-0" style={{ mixBlendMode: "screen" }}>
      {FLAME_DEFS.map(([cx, by, w, h, hue, dur, delay, inner], i) => {
        const keys = [
          flamePath(w, h, 0),
          flamePath(w * 0.9, h * 1.1, w * 0.16),
          flamePath(w * 1.06, h * 0.92, -w * 0.16),
          flamePath(w, h, 0),
        ];
        return (
          <svg
            key={i}
            viewBox="-100 -200 200 400"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            <g transform={`translate(${(cx - 50) * 2} ${(by - 50) * 4})`}>
              <path
                className="origin-bottom"
                fill={`hsl(${hue} 100% ${inner ? 66 : 54}%)`}
                opacity={inner ? 0.92 : 0.72}
                style={{
                  transformBox: "fill-box" as any,
                  transformOrigin: "50% 100%",
                  animation: `bonfire-sway ${dur}s ease-in-out ${-delay}s infinite, bonfire-flick ${(dur * 0.43).toFixed(2)}s ease-in-out ${-delay}s infinite`,
                }}
              >
                <animate
                  attributeName="d"
                  values={keys.join(";")}
                  dur={`${dur}s`}
                  begin={`${-delay}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;.33;.66;1"
                  keySplines=".4 0 .6 1;.4 0 .6 1;.4 0 .6 1"
                />
              </path>
            </g>
          </svg>
        );
      })}
    </div>
  );
}

function Embers({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    let W: number, H: number;
    let raf: number;

    function resize() {
      const r = cv!.getBoundingClientRect();
      W = cv!.width = r.width * dpr;
      H = cv!.height = r.height * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    interface Ember {
      x: number; y: number; vx: number; vy: number;
      r: number; life: number; max: number; hue: number;
      sway: number; sf: number;
    }

    function spawn(): Ember {
      return {
        x: (0.75 + (Math.random() - 0.5) * 0.06) * W,
        y: (0.34 + Math.random() * 0.06) * H,
        vx: (0.05 + (Math.random() - 0.5) * 0.18) * dpr,
        vy: -(0.3 + Math.random() * 0.75) * dpr,
        r: (0.7 + Math.random() * 1.7) * dpr,
        life: 0,
        max: 60 + Math.random() * 80,
        hue: 24 + Math.random() * 26,
        sway: Math.random() * 6.28,
        sf: 0.02 + Math.random() * 0.05,
      };
    }

    const N = 36;
    const parts: Ember[] = [];
    for (let i = 0; i < N; i++) {
      const p = spawn();
      p.life = Math.random() * p.max;
      parts.push(p);
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      ctx.shadowBlur = 0;
      for (const p of parts) {
        p.life++;
        p.sway += p.sf;
        p.x += p.vx + Math.cos(p.sway) * 0.4 * dpr;
        p.y += p.vy;
        p.vy *= 0.992;
        const t = p.life / p.max;
        const a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
        const r = p.r * (1 - t * 0.4);
        const alpha = Math.max(0, a) * 0.9;
        const glow = r * 3;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
        grad.addColorStop(0, `hsla(${p.hue},100%,${60 + t * 15}%,${alpha})`);
        grad.addColorStop(0.4, `hsla(${p.hue},100%,55%,${alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${p.hue},100%,55%,0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(p.x - glow, p.y - glow, glow * 2, glow * 2);
        if (p.life >= p.max || p.y < H * 0.05) Object.assign(p, spawn());
      }
      raf = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ mixBlendMode: "screen", pointerEvents: "none" }}
    />
  );
}

export function AnimatedBonfire({ className }: { className?: string }) {
  return (
    <>
      <style>{`
        @keyframes bonfire-heat {
          0%   { transform:scaleX(1) skewX(0deg);   filter:brightness(1) }
          25%  { transform:scaleX(1.02) skewX(.8deg); filter:brightness(1.12) }
          50%  { transform:scaleX(.985) skewX(-.6deg); filter:brightness(.97) }
          75%  { transform:scaleX(1.015) skewX(.5deg); filter:brightness(1.1) }
          100% { transform:scaleX(1) skewX(0deg);   filter:brightness(1) }
        }
        @keyframes bonfire-glow {
          0%,100% { opacity:.5; transform:translate(-50%,-50%) scale(1) }
          40%     { opacity:.9; transform:translate(-50%,-50%) scale(1.06) }
          60%     { opacity:.66;transform:translate(-50%,-50%) scale(.99) }
        }
        @keyframes bonfire-sway {
          0%,100% { transform:rotate(0) scaleY(1) }
          25%     { transform:rotate(2.4deg) scaleY(1.07) }
          50%     { transform:rotate(-1.4deg) scaleY(.94) }
          75%     { transform:rotate(1.7deg) scaleY(1.04) }
        }
        @keyframes bonfire-flick {
          0%,100% { opacity:.7 }
          50%     { opacity:1 }
        }
      `}</style>
      <div className={className} style={{ aspectRatio: "140.25 / 176.25" }}>
        <div className="relative h-full w-full overflow-hidden">
          {/* base image */}
          <div
            className="absolute inset-0 bg-center bg-no-repeat"
            style={{ backgroundImage: "url(/fogueira-base.svg)", backgroundSize: "100% 100%" }}
          />
          {/* heat shimmer */}
          <div
            className="absolute inset-0 bg-center bg-no-repeat will-change-transform"
            style={{
              backgroundImage: "url(/fogueira-base.svg)",
              backgroundSize: "100% 100%",
              mask: "radial-gradient(40% 44% at 52% 46%, #000 28%, transparent 70%)",
              WebkitMask: "radial-gradient(40% 44% at 52% 46%, #000 28%, transparent 70%)",
              animation: "bonfire-heat 2.2s ease-in-out infinite",
            }}
          />
          {/* glow */}
          <div
            className="absolute rounded-full"
            style={{
              left: "52%",
              top: "48%",
              width: "82%",
              height: "82%",
              transform: "translate(-50%,-50%)",
              mixBlendMode: "screen",
              filter: "blur(7px)",
              background: "radial-gradient(circle, rgba(255,150,40,.55) 0%, rgba(255,90,20,.26) 38%, transparent 66%)",
              animation: "bonfire-glow 1.6s ease-in-out infinite",
            }}
          />
          <Flames />
          <Embers className="absolute inset-0" />
        </div>
      </div>
    </>
  );
}
