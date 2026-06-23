import { motion } from "framer-motion";

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      className="relative flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center pb-64"
    >
      <motion.img
        src="/bandeirinhas.svg"
        alt=""
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="absolute top-0 left-1/2 w-[120vw] max-w-[600px] -translate-x-1/2 -translate-y-[45%] pointer-events-none top-[260px]"
      />

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <img src="/arraial-logo.svg" alt="Arraiá UNAERP" className="mx-auto h-64" />
        <p className="text-md leading-relaxed text-white/80">
          Registre os melhores momentos do arraial!
          <br />
          Escolha suas fotos e leve a recordação impressa.
        </p>
      </motion.div>

      <motion.img
        src="/arraial-mascot.svg"
        alt=""
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="absolute bottom-4 right-2 h-[30vw] max-h-56 drop-shadow-lg pointer-events-none"
      />

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
          COMEÇAR
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
