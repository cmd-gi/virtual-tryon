"use client"

import { useSession } from "@/lib/session-context"
import { detectGender } from "@/lib/api"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, RotateCcw, ArrowRight, X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CameraScreen() {
  const { navigateTo, updateSessionData, endSession } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setCapturedImage(result)
        stopCamera()
      }
      reader.readAsDataURL(file)
    }
  }
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true)
      setCameraError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setIsLoading(false)
    } catch (err) {
      console.error("[v0] Camera error:", err)
      setCameraError("Camera access denied. Please enable camera permissions.")
      setIsLoading(false)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    setCountdown(3)
  }, [])

  const takeSnapshot = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
        ctx.restore()
        const imageData = canvas.toDataURL("image/jpeg", 0.9)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }, [stopCamera])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    startCamera()
  }, [startCamera])

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return
    setIsConfirming(true)
    try {
      // Fire gender detection — ultra-fast (<1s) due to maxOutputTokens:20.
      // Always saves a result (falls back to "Unisex" on any error).
      const gender = await detectGender(capturedImage)
      updateSessionData({ capturedImage, detectedGender: gender })
    } catch {
      // Defensive fallback — detectGender itself never throws, but just in case
      updateSessionData({ capturedImage, detectedGender: "Unisex" })
    } finally {
      setIsConfirming(false)
      navigateTo("preferences")
    }
  }, [capturedImage, updateSessionData, navigateTo])

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (countdown === null) return
    if (countdown === 0) {
      takeSnapshot()
      setCountdown(null)
      return
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, takeSnapshot])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 flex items-center justify-between px-6 py-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={endSession}
          className="h-12 w-12 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 1 of 4</p>
          <h2 className="font-serif text-lg font-medium text-foreground">Capture Your Look</h2>
        </div>
        <div className="w-12" />
      </motion.header>

      {/* Camera View */}
      <div className="relative flex-1 overflow-hidden">
        {/* Camera or captured image */}
        <div className="absolute inset-0">
          {capturedImage ? (
            <motion.img
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={capturedImage}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent"
                />
                <p className="text-sm text-muted-foreground">Starting camera...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <Camera className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-muted-foreground">{cameraError}</p>
              <Button onClick={startCamera} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {countdown !== null && countdown > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-foreground/30 backdrop-blur-sm"
            >
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex h-32 w-32 items-center justify-center rounded-full bg-card shadow-2xl"
              >
                <span className="font-serif text-6xl font-light text-foreground">{countdown}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Frame overlay */}
        {!capturedImage && !isLoading && !cameraError && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative h-[70%] w-[80%] max-w-sm"
            >
              {/* Corner brackets */}
              <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-card/80" />
              <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-card/80" />
              <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-card/80" />
              <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-card/80" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative z-20 bg-card px-6 py-8"
      >
        {capturedImage ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={retakePhoto}
              className="h-14 gap-2 rounded-full px-6 bg-transparent"
            >
              <RotateCcw className="h-5 w-5" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={confirmPhoto}
              disabled={isConfirming}
              className="h-14 gap-2 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />

              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-14 w-14 rounded-full border-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
              >
                <Upload className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                onClick={capturePhoto}
                disabled={isLoading || !!cameraError}
                className="h-20 w-20 rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary/90 disabled:opacity-50"
              >
                <Camera className="h-8 w-8" />
              </Button>

              {/* Spacer to balance the layout */}
              <div className="w-14" />
            </div>
            <p className="text-sm text-muted-foreground">Tap to capture or upload</p>
          </div>
        )}
      </motion.div >
    </div >
  )
}
