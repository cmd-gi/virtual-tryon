"use client"

import { useSession } from "@/lib/session-context"
import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Camera, RotateCcw, ArrowRight, X, Upload, Loader2, ChevronDown, SwitchCamera, FlipHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface VideoDevice {
  deviceId: string
  label: string
}

export function CameraScreen() {
  const { navigateTo, updateSessionData, endSession } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)

  // Camera device selector
  const [devices, setDevices] = useState<VideoDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | "">("")
  const [showDevicePicker, setShowDevicePicker] = useState(false)
  const [isMirrored, setIsMirrored] = useState(false)

  /** Enumerate all video input devices and populate the selector */
  const loadDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
        }))
      setDevices(videoInputs)
      // Keep the selected device if it still exists, otherwise reset
      setSelectedDeviceId((prev) => {
        if (prev && videoInputs.some((d) => d.deviceId === prev)) return prev
        const firstId = videoInputs[0]?.deviceId || ""
        // Auto-enable mirror only for built-in/front cameras (not DroidCam/external)
        const firstLabel = (videoInputs[0]?.label || "").toLowerCase()
        const isBuiltIn = firstLabel.includes("built-in") || firstLabel.includes("integrated") || firstLabel.includes("facetime")
        setIsMirrored(isBuiltIn)
        return firstId
      })
    } catch {
      // silently fail — device list not critical
    }
  }, [])

  /** Start (or restart) the stream with the currently selected device */
  const startCamera = useCallback(
    async (deviceId?: string) => {
      try {
        setIsLoading(true)
        setCameraError(null)

        // Stop any existing stream first
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
          setStream(null)
        }

        const constraints: MediaStreamConstraints = {
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1080 }, height: { ideal: 1920 } }
            : { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }

        // After getting permission, refresh the device list so labels appear
        await loadDevices()
        setIsLoading(false)
      } catch (err) {
        console.error("[CameraScreen] Camera error:", err)
        setCameraError("Camera access denied or device not available.")
        setIsLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadDevices]
  )

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
        if (isMirrored) {
          ctx.scale(-1, 1)
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        }
        ctx.restore()
        const imageData = canvas.toDataURL("image/jpeg", 0.9)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }, [stopCamera, isMirrored])

  const retakePhoto = useCallback(() => {
    setCapturedImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    startCamera(selectedDeviceId || undefined)
  }, [startCamera, selectedDeviceId])

  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return
    setIsConfirming(true)
    try {
      updateSessionData({ capturedImage, detectedGender: "Unisex" })
    } catch {
      updateSessionData({ capturedImage, detectedGender: "Unisex" })
    } finally {
      setIsConfirming(false)
      navigateTo("preferences")
    }
  }, [capturedImage, updateSessionData, navigateTo])

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

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    setShowDevicePicker(false)
    // Auto-detect mirror: disable for DroidCam and external feeds
    const label = (devices.find(d => d.deviceId === deviceId)?.label || "").toLowerCase()
    const shouldMirror = label.includes("built-in") || label.includes("integrated") || label.includes("facetime") || label.includes("front")
    setIsMirrored(shouldMirror)
    await startCamera(deviceId)
  }

  // Initial mount: start camera then load devices
  useEffect(() => {
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown handler
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

  const selectedDeviceLabel =
    devices.find((d) => d.deviceId === selectedDeviceId)?.label || "Default Camera"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between px-6 py-4"
        >
          <Button variant="ghost" size="icon" onClick={endSession} className="h-12 w-12 rounded-full">
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 1 of 4</p>
            <h2 className="font-serif text-lg font-medium text-foreground">Capture Your Look</h2>
          </div>
          <div className="w-12" />
        </motion.header>

        {/* Camera source picker — only shown when NOT capturing */}
        {!capturedImage && devices.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-30 mx-6 mb-3"
          >
            <button
              onClick={() => setShowDevicePicker((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <SwitchCamera className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate font-medium">{selectedDeviceLabel}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", showDevicePicker && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showDevicePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                >
                  {devices.map((device) => (
                    <button
                      key={device.deviceId}
                      onClick={() => handleDeviceChange(device.deviceId)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-muted",
                        device.deviceId === selectedDeviceId && "bg-primary/5 text-primary font-medium"
                      )}
                    >
                      <Camera className="h-4 w-4 shrink-0" />
                      <span className="truncate">{device.label}</span>
                      {device.deviceId === selectedDeviceId && (
                        <span className="ml-auto shrink-0 h-2 w-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Camera View */}
        <div className="relative flex-1 overflow-hidden rounded-none md:rounded-2xl md:mx-6 md:mb-4">
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
                  className={cn(
                    "h-full w-full object-cover transition-transform",
                    isMirrored && "scale-x-[-1]"
                  )}
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
          </div>

          {/* Loading */}
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

          {/* Error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-background p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <Camera className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-muted-foreground">{cameraError}</p>
                <Button onClick={() => startCamera(selectedDeviceId || undefined)} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Countdown */}
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

          {/* Frame guide + Mirror toggle */}
          {!capturedImage && !isLoading && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="relative h-[70%] w-[60%] max-w-xs"
              >
                <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-card/80" />
                <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-card/80" />
                <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-card/80" />
                <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-card/80" />
              </motion.div>
            </div>
          )}

          {/* Mirror toggle button — always accessible */}
          {!capturedImage && !isLoading && !cameraError && (
            <button
              onClick={() => setIsMirrored((v) => !v)}
              className={cn(
                "pointer-events-auto absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-card/40 backdrop-blur-sm transition-colors",
                isMirrored ? "bg-primary text-primary-foreground" : "bg-card/70 text-foreground"
              )}
              title={isMirrored ? "Mirror: ON" : "Mirror: OFF"}
            >
              <FlipHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-20 bg-card px-6 py-6 md:rounded-2xl md:mx-6 md:mb-6"
        >
          {capturedImage ? (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={retakePhoto}
                className="h-14 flex-1 gap-2 rounded-full px-6 bg-transparent md:flex-none md:w-40"
              >
                <RotateCcw className="h-5 w-5" />
                Retake
              </Button>
              <Button
                size="lg"
                onClick={confirmPhoto}
                disabled={isConfirming}
                className="h-14 flex-1 gap-2 rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90 disabled:opacity-70 md:flex-none md:w-48"
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

                <div className="w-14" />
              </div>
              <p className="text-sm text-muted-foreground">Tap to capture or upload a photo</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
