"use client"

import { useSession } from "@/lib/session-context"
import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Briefcase, PartyPopper, Sun, Sparkles, Heart, Zap, Flower2, Gem } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const occasions = [
  { id: "business", label: "Business", icon: Briefcase, description: "Professional meetings & work" },
  { id: "casual", label: "Casual", icon: Sun, description: "Everyday comfort & style" },
  { id: "party", label: "Party", icon: PartyPopper, description: "Celebrations & nights out" },
  { id: "date", label: "Date Night", icon: Heart, description: "Romantic evenings" },
]

const styles = [
  { id: "classic", label: "Classic", icon: Gem, description: "Timeless elegance" },
  { id: "modern", label: "Modern", icon: Zap, description: "Contemporary edge" },
  { id: "bohemian", label: "Bohemian", icon: Flower2, description: "Free-spirited flow" },
  { id: "minimalist", label: "Minimalist", icon: Sparkles, description: "Clean & refined" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function PreferencesScreen() {
  const { navigateTo, updateSessionData, sessionData } = useSession()
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(sessionData.selectedOccasion)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(sessionData.selectedStyle)
  const [step, setStep] = useState<"occasion" | "style">("occasion")

  const handleContinue = () => {
    if (step === "occasion" && selectedOccasion) {
      updateSessionData({ selectedOccasion })
      setStep("style")
    } else if (step === "style" && selectedStyle) {
      updateSessionData({ selectedStyle })
      navigateTo("recommendations")
    }
  }

  const handleBack = () => {
    if (step === "style") {
      setStep("occasion")
    } else {
      navigateTo("camera")
    }
  }

  const canContinue = step === "occasion" ? !!selectedOccasion : !!selectedStyle

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-12 w-12 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 2 of 4</p>
          <h2 className="font-serif text-lg font-medium text-foreground">
            {step === "occasion" ? "Choose Your Occasion" : "Select Your Style"}
          </h2>
        </div>
        <div className="w-12" />
      </motion.header>

      {/* Progress indicator */}
      <div className="mx-6 mb-8 flex gap-2">
        <div className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          step === "occasion" ? "bg-primary" : "bg-primary"
        )} />
        <div className={cn(
          "h-1 flex-1 rounded-full transition-colors",
          step === "style" ? "bg-primary" : "bg-muted"
        )} />
      </div>

      {/* Content */}
      <div className="flex-1 px-6">
        {step === "occasion" ? (
          <motion.div
            key="occasion"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            <motion.p
              variants={itemVariants}
              className="mb-4 text-center text-muted-foreground"
            >
              What&apos;s the occasion? Let us curate the perfect look for you.
            </motion.p>
            {occasions.map((occasion) => {
              const Icon = occasion.icon
              const isSelected = selectedOccasion === occasion.id
              return (
                <motion.button
                  key={occasion.id}
                  variants={itemVariants}
                  onClick={() => setSelectedOccasion(occasion.id)}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{occasion.label}</h3>
                    <p className="text-sm text-muted-foreground">{occasion.description}</p>
                  </div>
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            key="style"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            <motion.p
              variants={itemVariants}
              className="mb-4 text-center text-muted-foreground"
            >
              What aesthetic speaks to you?
            </motion.p>
            {styles.map((style) => {
              const Icon = style.icon
              const isSelected = selectedStyle === style.id
              return (
                <motion.button
                  key={style.id}
                  variants={itemVariants}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl transition-colors",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{style.label}</h3>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </div>
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex h-full w-full items-center justify-center"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card px-6 py-8"
      >
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!canContinue}
          className="h-14 w-full gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {step === "style" ? "See Recommendations" : "Continue"}
          <ArrowRight className="h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  )
}
