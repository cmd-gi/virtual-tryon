"use client"

import { useSession } from "@/lib/session-context"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Check, RotateCcw, ShoppingBag, AlertCircle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { generateTryOn } from "@/lib/api"

type ViewMode = "split" | "overlay"

export function TryOnScreen() {
  const { navigateTo, sessionData, sessionId, endSession, updateSessionData } = useSession()
  const [isProcessing, setIsProcessing] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [processingStep, setProcessingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [tryOnResult, setTryOnResult] = useState<string | null>(null)

  const processingSteps = [
    "Analyzing your features...",
    "Preparing outfit...",
    "Generating virtual try-on...",
    "Finalizing your look...",
  ]

  const performTryOn = useCallback(async () => {
    if (!sessionData.capturedImage || !sessionData.selectedOutfit) {
      setError("Missing captured image or selected outfit")
      setIsProcessing(false)
      return
    }

    try {
      const outfit = sessionData.selectedOutfit as any
      const response = await generateTryOn(sessionData.capturedImage, outfit.id)

      if (response.success && response.tryon_result_image) {
        setTryOnResult(response.tryon_result_image)
        updateSessionData({ tryOnResult: response.tryon_result_image })
      } else {
        setError(response.error || "Failed to generate try-on")
      }
    } catch (err) {
      console.error("Try-on error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsProcessing(false)
    }
  }, [sessionData.capturedImage, sessionData.selectedOutfit, sessionId, updateSessionData])

  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true
      performTryOn()
    }
  }, [performTryOn])

  useEffect(() => {
    if (!isProcessing) return
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % processingSteps.length)
    }, 3000)
    return () => clearInterval(stepInterval)
  }, [isProcessing, processingSteps.length])

  const handleTryAnotherOriginal = () => {
    navigateTo("recommendations")
  }

  const handleTryAnotherResult = () => {
    if (resultImage) {
      updateSessionData({ capturedImage: resultImage })
    }
    navigateTo("recommendations")
  }

  const handleRetry = () => {
    setError(null)
    setIsProcessing(true)
    setProcessingStep(0)
    hasStartedRef.current = false
    performTryOn()
    hasStartedRef.current = true
  }

  const handleFinish = () => {
    endSession()
  }

  const resultImage = tryOnResult || (sessionData.selectedOutfit as any)?.image || ""

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between px-6 py-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo("recommendations")}
            className="h-12 w-12 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 4 of 4</p>
            <h2 className="font-serif text-lg font-medium text-foreground">Your Virtual Look</h2>
          </div>
          <div className="w-12" />
        </motion.header>

        {/* Main Content */}
        <div className="relative flex-1">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background px-8"
              >
                {/* Processing animation */}
                <div className="relative mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-24 w-24 rounded-full border-2 border-muted"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-2 rounded-full border-2 border-primary border-t-transparent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className="h-12 w-12 rounded-full bg-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-3 text-center">
                  {processingSteps.map((step, index) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: index <= processingStep ? 1 : 0.3, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "flex items-center justify-center gap-2 text-sm",
                        index === processingStep ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {index < processingStep && <Check className="h-4 w-4 text-primary" />}
                      {index === processingStep && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Number.POSITIVE_INFINITY }}
                          className="h-2 w-2 rounded-full bg-primary"
                        />
                      )}
                      <span>{step}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  AI is working its magic. This may take 15–60 seconds.
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-background px-8"
              >
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Something went wrong</h3>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <div className="flex gap-3 mt-4 flex-wrap justify-center">
                    <Button variant="outline" onClick={handleTryAnotherOriginal}>
                      Choose Another Outfit
                    </Button>
                    <Button onClick={handleRetry}>
                      Try Again
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col"
              >
                {/* View mode toggle */}
                <div className="flex justify-center px-6 py-3">
                  <div className="flex rounded-full bg-muted p-1">
                    <button
                      onClick={() => setViewMode("split")}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        viewMode === "split" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Split View
                    </button>
                    <button
                      onClick={() => setViewMode("overlay")}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        viewMode === "overlay" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Overlay
                    </button>
                  </div>
                </div>

                {/* Images */}
                <div className="flex-1 px-6 pb-4 min-h-0">
                  {viewMode === "split" ? (
                    <div className="grid h-full grid-cols-2 gap-3 md:gap-6">
                      {/* Original */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative overflow-hidden rounded-2xl bg-muted"
                      >
                        {sessionData.capturedImage ? (
                          <img
                            src={sessionData.capturedImage}
                            alt="Original"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-sm text-muted-foreground">Original</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
                          Before
                        </div>
                      </motion.div>

                      {/* Result */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl bg-muted"
                      >
                        {resultImage ? (
                          <img
                            src={resultImage}
                            alt="Try-on result"
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <span className="text-sm text-muted-foreground">Result</span>
                          </div>
                        )}
                        <div className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                          After
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative mx-auto h-full max-w-md overflow-hidden rounded-3xl bg-muted"
                    >
                      {resultImage && (
                        <img
                          src={resultImage}
                          alt="Your look"
                          className="h-full w-full object-cover"
                          crossOrigin="anonymous"
                        />
                      )}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm whitespace-nowrap">
                        Your New Look
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Outfit info */}
                {sessionData.selectedOutfit && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mx-6 mb-3 rounded-2xl bg-card p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-serif text-base font-medium text-foreground md:text-lg truncate">
                          {sessionData.selectedOutfit.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {sessionData.selectedOutfit.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-base font-semibold text-foreground md:text-lg">
                        {sessionData.selectedOutfit.price}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {!isProcessing && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card px-6 py-5 space-y-3"
          >
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handleTryAnotherOriginal}
                className="h-12 flex-1 gap-2 rounded-full bg-transparent text-xs sm:text-sm md:h-14"
              >
                <RotateCcw className="h-4 w-4 shrink-0" />
                <span className="truncate">Original Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleTryAnotherResult}
                className="h-12 flex-1 gap-2 rounded-full bg-primary/10 border-primary/30 text-xs sm:text-sm md:h-14"
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span className="truncate">Re-use This Look</span>
              </Button>
            </div>
            <Button
              size="lg"
              onClick={handleFinish}
              className="h-12 w-full gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 md:h-14"
            >
              <ShoppingBag className="h-5 w-5" />
              Complete Experience
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
