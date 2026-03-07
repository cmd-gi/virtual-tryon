"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Outfit } from "@/lib/api"

interface ClothingCardProps {
    item: Outfit
    onEdit: () => void
    onDelete: () => void
}

export function ClothingCard({ item, onEdit, onDelete }: ClothingCardProps) {
    return (
        <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md">
            {/* Image */}
            <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                <img
                    src={item.image || item.preview_image || "/placeholder.svg"}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    crossOrigin="anonymous"
                />
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-slate-900 truncate">{item.name}</h3>
                        <p className="text-sm text-slate-500 truncate">
                            {(item as any).category} • {(item as any).occasion}
                        </p>
                    </div>
                    {item.price && (
                        <span className="text-sm font-semibold text-slate-900">
                            {item.price}
                        </span>
                    )}
                </div>

                {/* Tags */}
                <div className="mt-2 flex flex-wrap gap-1">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                        {(item as any).style || "modern"}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                        {(item as any).gender || "unisex"}
                    </span>
                </div>

                {item.description && (
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                        {item.description}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                    onClick={onEdit}
                >
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-red-50 hover:text-red-600"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
