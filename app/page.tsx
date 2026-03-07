"use client"

import { SessionProvider } from "@/lib/session-context"
import { KioskShell } from "@/components/kiosk-shell"

export default function Page() {
  return (
    <SessionProvider>
      <KioskShell />
    </SessionProvider>
  )
}
