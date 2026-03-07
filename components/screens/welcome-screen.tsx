"use client"

import { useSession } from "@/lib/session-context"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function WelcomeScreen() {
  const { startSession } = useSession()

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-8 py-12"
      onClick={startSession}
      onKeyDown={(e) => e.key === "Enter" && startSession()}
      role="button"
      tabIndex={0}
    >
      {/* Animated background rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-border/30"
            initial={{ width: 200, height: 200, opacity: 0 }}
            animate={{
              width: [200 + i * 100, 400 + i * 100, 200 + i * 100],
              height: [200 + i * 100, 400 + i * 100, 200 + i * 100],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 4,
              delay: i * 0.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Logo and brand */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>

        <h1 className="mb-4 text-center font-serif text-5xl font-light tracking-tight text-foreground md:text-6xl lg:text-7xl">
          <span className="text-balance">StyleMirror</span>
        </h1>

        <p className="mb-12 max-w-md text-center text-lg text-muted-foreground">
          Discover your perfect look with our AI-powered virtual try-on experience
        </p>
      </motion.div>

      {/* Tap to start CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-primary/20 bg-card shadow-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <span className="text-sm font-medium uppercase tracking-widest">Tap</span>
            </div>
          </div>
        </motion.div>

        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="mt-8 text-sm font-medium uppercase tracking-widest text-muted-foreground"
        >
          Tap anywhere to begin
        </motion.p>
      </motion.div>

      {/* Bottom decorative line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
        className="absolute bottom-12 left-1/2 h-px w-32 -translate-x-1/2 bg-border"
      />
    </div>
  )
}
