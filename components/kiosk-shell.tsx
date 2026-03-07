"use client"

import { useSession } from "@/lib/session-context"
import { AnimatePresence, motion } from "framer-motion"
import { WelcomeScreen } from "./screens/welcome-screen"
import { CameraScreen } from "./screens/camera-screen"
import { PreferencesScreen } from "./screens/preferences-screen"
import { RecommendationsScreen } from "./screens/recommendations-screen"
import { TryOnScreen } from "./screens/try-on-screen"
import { ExitScreen } from "./screens/exit-screen"

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function KioskShell() {
  const { currentScreen } = useSession()

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <WelcomeScreen key="welcome" />
      case "camera":
        return <CameraScreen key="camera" />
      case "preferences":
        return <PreferencesScreen key="preferences" />
      case "recommendations":
        return <RecommendationsScreen key="recommendations" />
      case "try-on":
        return <TryOnScreen key="try-on" />
      case "exit":
        return <ExitScreen key="exit" />
      default:
        return <WelcomeScreen key="welcome" />
    }
  }

  return (
    <div className="kiosk-container relative flex flex-col bg-background">
      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-muted/50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-muted/30 blur-3xl" />
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="relative z-10 flex min-h-screen flex-1 flex-col"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
