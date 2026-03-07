"use client"

import { useSession } from "@/lib/session-context"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Heart, Sparkles } from "lucide-react"

export function ExitScreen() {
  const { resetSession } = useSession()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          resetSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resetSession])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              scale: 0,
              x: Math.random() * 400 - 200,
              y: Math.random() * 400 - 200,
            }}
            animate={{
              opacity: [0, 0.3, 0],
              scale: [0, 1, 0],
              y: [0, -200],
            }}
            transition={{
              duration: 3,
              delay: i * 0.2,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 2,
            }}
            className="absolute left-1/2 top-1/2"
          >
            <Sparkles className="h-4 w-4 text-primary/40" />
          </motion.div>
        ))}
      </div>

      {/* Thank you content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center"
      >
        {/* Heart icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10"
          >
            <Heart className="h-12 w-12 text-primary" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 font-serif text-4xl font-light tracking-tight text-foreground md:text-5xl"
        >
          <span className="text-balance">Thank You</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 max-w-sm text-lg text-muted-foreground"
        >
          We hope you enjoyed your virtual try-on experience. Visit us again soon!
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <motion.span
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-serif text-3xl font-light text-foreground"
            >
              {countdown}
            </motion.span>
          </div>
          <p className="text-sm text-muted-foreground">Returning to start</p>
        </motion.div>
      </motion.div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
        className="absolute bottom-12 left-1/2 h-px w-32 -translate-x-1/2 bg-border"
      />
    </div>
  )
}
