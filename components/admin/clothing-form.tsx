"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

export interface ClothingFormData {
    name: string
    category: string
    occasion: string
    style: string
    gender: string
    garmentImage: string
    previewImage: string
    garmentDescription: string
    description: string
    price: string
}

interface ClothingFormProps {
    initialData?: ClothingFormData
    onSubmit: (data: ClothingFormData) => Promise<void>
    onCancel: () => void
    isSubmitting: boolean
}

const categories = [
    "upper_half_sleeve",
    "upper_full_sleeve",
    "lower_body",
    "full_body",
    "outerwear"
]

const occasions = ["business", "casual", "party", "date"]
const styles = ["classic", "modern", "minimalist", "bohemian"]
const genders = ["male", "female", "unisex"]

export function ClothingForm({ initialData, onSubmit, onCancel, isSubmitting }: ClothingFormProps) {
    const [formData, setFormData] = useState<ClothingFormData>(initialData || {
        name: "",
        category: "upper_half_sleeve",
        occasion: "casual",
        style: "modern",
        gender: "unisex",
        garmentImage: "",
        previewImage: "",
        garmentDescription: "",
        description: "",
        price: "",
    })

    const [garmentPreview, setGarmentPreview] = useState<string>(initialData?.garmentImage || "")
    const [previewImagePreview, setPreviewImagePreview] = useState<string>(initialData?.previewImage || "")

    const garmentInputRef = useRef<HTMLInputElement>(null)
    const previewInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "garment" | "preview") => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const base64 = event.target?.result as string
            if (type === "garment") {
                setGarmentPreview(base64)
                setFormData(prev => ({ ...prev, garmentImage: base64 }))
            } else {
                setPreviewImagePreview(base64)
                setFormData(prev => ({ ...prev, previewImage: base64 }))
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.garmentImage || !formData.previewImage) {
            alert("Please fill in all required fields and upload both images")
            return
        }

        await onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., Executive Blazer"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Price
                    </label>
                    <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., $299"
                    />
                </div>
            </div>

            {/* Category and Classification */}
            <div className="grid gap-4 sm:grid-cols-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category *
                    </label>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Occasion *
                    </label>
                    <select
                        value={formData.occasion}
                        onChange={(e) => setFormData(prev => ({ ...prev, occasion: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        {occasions.map(occ => (
                            <option key={occ} value={occ}>{occ.charAt(0).toUpperCase() + occ.slice(1)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Style *
                    </label>
                    <select
                        value={formData.style}
                        onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        {styles.map(sty => (
                            <option key={sty} value={sty}>{sty.charAt(0).toUpperCase() + sty.slice(1)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Gender *
                    </label>
                    <select
                        value={formData.gender}
                        onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                        {genders.map(gen => (
                            <option key={gen} value={gen}>{gen.charAt(0).toUpperCase() + gen.slice(1)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        Garment Description (IDM-VTON) *
                    </label>
                    <textarea
                        value={formData.garmentDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, garmentDescription: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="e.g. A grey hooded sweatshirt with a front pocket"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        General Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        rows={3}
                        placeholder="Describe the clothing item..."
                    />
                </div>
            </div>

            {/* Image Uploads */}
            <div className="grid gap-6 sm:grid-cols-2">
                {/* Garment Image */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Garment Image * (for Try-On)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                        Upload a clean image of just the garment (flat lay or on mannequin)
                    </p>
                    <input
                        ref={garmentInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "garment")}
                        className="hidden"
                    />
                    <div
                        onClick={() => garmentInputRef.current?.click()}
                        className="relative cursor-pointer rounded-lg border-2 border-dashed border-slate-200 p-4 text-center hover:border-blue-400 transition-colors"
                    >
                        {garmentPreview ? (
                            <div className="relative">
                                <img
                                    src={garmentPreview}
                                    alt="Garment preview"
                                    className="h-40 w-full object-contain rounded"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setGarmentPreview("")
                                        setFormData(prev => ({ ...prev, garmentImage: "" }))
                                    }}
                                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="py-8">
                                <Upload className="h-8 w-8 mx-auto text-slate-400" />
                                <p className="text-sm text-slate-500 mt-2">Click to upload</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Image */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preview Image * (for UI display)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                        Upload a styled/lifestyle image for the catalog display
                    </p>
                    <input
                        ref={previewInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "preview")}
                        className="hidden"
                    />
                    <div
                        onClick={() => previewInputRef.current?.click()}
                        className="relative cursor-pointer rounded-lg border-2 border-dashed border-slate-200 p-4 text-center hover:border-blue-400 transition-colors"
                    >
                        {previewImagePreview ? (
                            <div className="relative">
                                <img
                                    src={previewImagePreview}
                                    alt="Preview image"
                                    className="h-40 w-full object-contain rounded"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setPreviewImagePreview("")
                                        setFormData(prev => ({ ...prev, previewImage: "" }))
                                    }}
                                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="py-8">
                                <Upload className="h-8 w-8 mx-auto text-slate-400" />
                                <p className="text-sm text-slate-500 mt-2">Click to upload</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : (initialData ? "Update" : "Create")}
                </Button>
            </div>
        </form>
    )
}
