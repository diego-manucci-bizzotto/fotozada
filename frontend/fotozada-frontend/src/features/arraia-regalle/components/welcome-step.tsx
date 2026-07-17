import { motion } from "framer-motion";
import { AnimatedBonfire } from "./animated-bonfire";

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center pb-48"
    >
      <motion.img
        src="/bandeirinhas.svg"
        alt=""
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="absolute -top-12 left-1/2 w-[600px] max-w-[600px] -translate-x-1/2 -translate-y-[45%] pointer-events-none"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <img src="/arraia-regalle/arraia-regalle-logo.svg" alt="Arraiá" className="mx-auto h-64" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-white">
            Registre os melhores momentos do arraiá!
          </h2>
          <p className="text-sm leading-relaxed text-white/50">
          Mais quente que fogueira de São João!
          <br />
          Escolha suas fotos e leve a recordação impressa.
        </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="absolute -bottom-10 left-1/2 -translate-x-1/2 pointer-events-none"
      >
        <AnimatedBonfire className="h-64 w-auto" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="rounded-2xl bg-amber-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-amber-500/30"
        >
          INICIAR
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
