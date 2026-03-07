"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type KioskScreen =
  | "welcome"
  | "camera"
  | "preferences"
  | "recommendations"
  | "try-on"
  | "exit"

export interface SessionData {
  capturedImage: string | null
  selectedOccasion: string | null
  selectedStyle: string | null
  selectedOutfit: Outfit | null
  tryOnResult: string | null
  detectedGender: string | null  // Set by vision API after photo capture
}

export interface Outfit {
  id: string
  name: string
  image: string
  category: string
  style?: string
  gender?: string
  description: string
  price: string
  garment_image?: string  // For try-on (optional for backward compatibility)
}

interface SessionContextType {
  currentScreen: KioskScreen
  sessionData: SessionData
  sessionId: string | null
  isSessionActive: boolean
  startSession: () => void
  endSession: () => void
  navigateTo: (screen: KioskScreen) => void
  updateSessionData: (data: Partial<SessionData>) => void
  resetSession: () => void
}

const initialSessionData: SessionData = {
  capturedImage: null,
  selectedOccasion: null,
  selectedStyle: null,
  selectedOutfit: null,
  tryOnResult: null,
  detectedGender: null,
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

const SESSION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const INACTIVITY_TIMEOUT = 2 * 60 * 1000 // 2 minutes of inactivity

export function SessionProvider({ children }: { children: ReactNode }) {
  const [currentScreen, setCurrentScreen] = useState<KioskScreen>("welcome")
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSessionActive, setIsSessionActive] = useState(false)
  const [lastActivity, setLastActivity] = useState<number>(Date.now())

  const resetSession = useCallback(() => {
    setCurrentScreen("welcome")
    setSessionData(initialSessionData)
    setSessionId(null)
    setIsSessionActive(false)
  }, [])

  const startSession = useCallback(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)
    setIsSessionActive(true)
    setLastActivity(Date.now())
    setCurrentScreen("camera")
  }, [])

  const endSession = useCallback(() => {
    setCurrentScreen("exit")
    setTimeout(() => {
      resetSession()
    }, 5000)
  }, [resetSession])

  const navigateTo = useCallback((screen: KioskScreen) => {
    setCurrentScreen(screen)
    setLastActivity(Date.now())
  }, [])

  const updateSessionData = useCallback((data: Partial<SessionData>) => {
    setSessionData((prev) => ({ ...prev, ...data }))
    setLastActivity(Date.now())
  }, [])

  // Session timeout
  useEffect(() => {
    if (!isSessionActive) return

    const sessionTimer = setTimeout(() => {
      endSession()
    }, SESSION_TIMEOUT)

    return () => clearTimeout(sessionTimer)
  }, [isSessionActive, endSession])

  // Inactivity timeout
  useEffect(() => {
    if (!isSessionActive) return

    const checkInactivity = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT) {
        endSession()
      }
    }, 10000)

    return () => clearInterval(checkInactivity)
  }, [isSessionActive, lastActivity, endSession])

  // Track user activity
  useEffect(() => {
    if (!isSessionActive) return

    const handleActivity = () => setLastActivity(Date.now())

    window.addEventListener("touchstart", handleActivity)
    window.addEventListener("click", handleActivity)

    return () => {
      window.removeEventListener("touchstart", handleActivity)
      window.removeEventListener("click", handleActivity)
    }
  }, [isSessionActive])

  return (
    <SessionContext.Provider
      value={{
        currentScreen,
        sessionData,
        sessionId,
        isSessionActive,
        startSession,
        endSession,
        navigateTo,
        updateSessionData,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider")
  }
  return context
}
