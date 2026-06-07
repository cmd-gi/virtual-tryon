"use client"

import { useSession, type Outfit } from "@/lib/session-context"
import { getRecommendations } from "@/lib/api"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function RecommendationsScreen() {
  const { navigateTo, updateSessionData, sessionData } = useSession()
  const detectedGender = sessionData.detectedGender
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [recommendations, setRecommendations] = useState<Outfit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      setIsLoading(true)
      setError(null)
      try {
        const items = await getRecommendations(
          sessionData.selectedOccasion,
          sessionData.selectedStyle,
          detectedGender
        )
        const mappedItems: Outfit[] = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.image || item.preview_image,
          category: item.category || `${sessionData.selectedOccasion}-${sessionData.selectedStyle}`,
          style: item.style,
          gender: item.gender,
          description: item.description || "",
          price: item.price || "",
          garment_image: item.garment_image,
        }))
        setRecommendations(mappedItems)
      } catch (err) {
        console.error("Error fetching recommendations:", err)
        setError("Failed to load recommendations")
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecommendations()
  }, [sessionData.selectedOccasion, sessionData.selectedStyle])

  const displayItems = recommendations

  const handlePrevious = () => {
    setDirection(-1)
    setSelectedIndex((prev) => (prev === 0 ? displayItems.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setDirection(1)
    setSelectedIndex((prev) => (prev === displayItems.length - 1 ? 0 : prev + 1))
  }

  const handleSelectOutfit = (outfit: Outfit) => {
    updateSessionData({ selectedOutfit: outfit })
    navigateTo("try-on")
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-4"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateTo("preferences")}
            className="h-12 w-12 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Step 3 of 4</p>
            <h2 className="font-serif text-lg font-medium text-foreground">Curated For You</h2>
          </div>
          <div className="w-12" />
        </motion.header>

        {/* Preferences badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-6 mb-4 flex items-center justify-center gap-2"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            {sessionData.selectedOccasion} / {sessionData.selectedStyle}
          </span>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading recommendations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigateTo("preferences")} variant="outline">Go Back</Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayItems.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-muted-foreground">
                No outfits available yet. Add some in the admin portal!
              </p>
              <Button onClick={() => navigateTo("preferences")} variant="outline">Go Back</Button>
            </div>
          </div>
        )}

        {/* Outfit Carousel */}
        {!isLoading && !error && displayItems.length > 0 && (
          <>
            {/* Desktop: side-by-side grid — Mobile: single card carousel */}
            <div className="hidden md:flex flex-1 flex-col px-6 pb-4">
              <div className="grid flex-1 grid-cols-2 gap-4 lg:grid-cols-3">
                {displayItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectOutfit(item)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-md transition-transform hover:scale-[1.02] hover:shadow-xl"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        crossOrigin="anonymous"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4 text-card">
                        <p className="text-xs font-medium uppercase tracking-widest text-card/70">{item.price}</p>
                        <h3 className="font-serif text-base font-medium text-card leading-tight">{item.name}</h3>
                        <p className="mt-1 text-xs text-card/80 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile: carousel */}
            <div className="flex flex-1 flex-col px-6 pb-4 md:hidden">
              <div className="relative mx-auto h-full w-full max-w-sm">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={selectedIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="relative h-[55vh] overflow-hidden rounded-3xl bg-card shadow-xl"
                  >
                    <img
                      src={displayItems[selectedIndex]?.image || "/placeholder.svg"}
                      alt={displayItems[selectedIndex]?.name}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-card">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-card/70">
                          {displayItems[selectedIndex]?.price || ""}
                        </p>
                        <h3 className="mb-2 font-serif text-2xl font-medium text-card">
                          {displayItems[selectedIndex]?.name}
                        </h3>
                        <p className="text-sm text-card/80">
                          {displayItems[selectedIndex]?.description}
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation arrows */}
                {displayItems.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronLeft className="h-6 w-6 text-foreground" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-lg transition-transform hover:scale-110"
                    >
                      <ChevronRight className="h-6 w-6 text-foreground" />
                    </button>
                  </>
                )}
              </div>

              {/* Pagination dots */}
              {displayItems.length > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  {displayItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setDirection(index > selectedIndex ? 1 : -1)
                        setSelectedIndex(index)
                      }}
                      className={cn(
                        "h-2 rounded-full transition-all",
                        index === selectedIndex ? "w-8 bg-primary" : "w-2 bg-muted hover:bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card px-6 py-6"
            >
              {/* Mobile: try selected */}
              <div className="md:hidden">
                <Button
                  size="lg"
                  onClick={() => displayItems[selectedIndex] && handleSelectOutfit(displayItems[selectedIndex])}
                  disabled={!displayItems[selectedIndex]}
                  className="h-14 w-full gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Try This On
                  <Sparkles className="h-5 w-5" />
                </Button>
              </div>
              {/* Desktop: shown inline on each card, hide footer button */}
              <div className="hidden md:block">
                <p className="text-center text-sm text-muted-foreground">Click any outfit card to try it on</p>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
