"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAllClothing, createClothing, updateClothing, deleteClothing, type Outfit } from "@/lib/api"
import { ClothingForm, type ClothingFormData } from "@/components/admin/clothing-form"
import { ClothingCard } from "@/components/admin/clothing-card"

export default function AdminPage() {
    const [clothing, setClothing] = useState<Outfit[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [editingItem, setEditingItem] = useState<Outfit | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const fetchClothing = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const items = await getAllClothing()
            setClothing(items)
        } catch (err) {
            setError("Failed to load clothing items")
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchClothing()
    }, [fetchClothing])

    const handleCreate = async (data: ClothingFormData) => {
        setIsSubmitting(true)
        try {
            const result = await createClothing({
                name: data.name,
                category: data.category,
                occasion: data.occasion,
                style: data.style,
                gender: data.gender,
                garment_image: data.garmentImage,
                preview_image: data.previewImage,
                garment_description: data.garmentDescription,
                description: data.description,
                price: data.price,
            })

            if (result) {
                setShowForm(false)
                await fetchClothing()
            } else {
                setError("Failed to create clothing item")
            }
        } catch (err) {
            setError("Failed to create clothing item")
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdate = async (data: ClothingFormData) => {
        if (!editingItem) return

        setIsSubmitting(true)
        try {
            const updates: any = {
                name: data.name,
                category: data.category,
                occasion: data.occasion,
                style: data.style,
                gender: data.gender,
                garment_description: data.garmentDescription,
                description: data.description,
                price: data.price,
            }

            // Only include images if they've changed
            if (data.garmentImage && data.garmentImage !== editingItem.garment_image) {
                updates.garment_image = data.garmentImage
            }
            if (data.previewImage && data.previewImage !== editingItem.preview_image) {
                updates.preview_image = data.previewImage
            }

            const result = await updateClothing(editingItem.id, updates)

            if (result) {
                setEditingItem(null)
                setShowForm(false)
                await fetchClothing()
            } else {
                setError("Failed to update clothing item")
            }
        } catch (err) {
            setError("Failed to update clothing item")
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return

        try {
            const success = await deleteClothing(id)
            if (success) {
                await fetchClothing()
            } else {
                setError("Failed to delete clothing item")
            }
        } catch (err) {
            setError("Failed to delete clothing item")
            console.error(err)
        }
    }

    const handleEdit = (item: Outfit) => {
        setEditingItem(item)
        setShowForm(true)
    }

    const handleCloseForm = () => {
        setShowForm(false)
        setEditingItem(null)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Clothing Catalog</h2>
                    <p className="text-sm text-slate-600">
                        Manage clothing items for the virtual try-on kiosk
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchClothing}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Clothing
                    </Button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-4 text-sm underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-semibold">
                            {editingItem ? "Edit Clothing Item" : "Add New Clothing Item"}
                        </h3>
                        <ClothingForm
                            initialData={editingItem ? {
                                name: editingItem.name,
                                category: (editingItem as any).category || "",
                                occasion: (editingItem as any).occasion || "",
                                style: (editingItem as any).style || "",
                                gender: (editingItem as any).gender || "unisex",
                                garmentImage: editingItem.garment_image || "",
                                previewImage: editingItem.preview_image || editingItem.image || "",
                                garmentDescription: (editingItem as any).garment_description || "",
                                description: editingItem.description || "",
                                price: editingItem.price || "",
                            } : undefined}
                            onSubmit={editingItem ? handleUpdate : handleCreate}
                            onCancel={handleCloseForm}
                            isSubmitting={isSubmitting}
                        />
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            )}

            {/* Empty State */}
            {!isLoading && clothing.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-12 text-center">
                    <p className="text-slate-600">No clothing items yet.</p>
                    <p className="text-sm text-slate-400 mt-1">
                        Click &quot;Add Clothing&quot; to create your first item.
                    </p>
                </div>
            )}

            {/* Clothing Grid */}
            {!isLoading && clothing.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {clothing.map((item) => (
                        <ClothingCard
                            key={item.id}
                            item={item}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
