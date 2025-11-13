// components/DeleteExperience.tsx
'use client'

import { useState } from 'react'
import axios from 'axios'
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

interface DeleteExperienceProps {
  id: string
  /** Called immediately to remove the item from UI */
  onOptimisticDelete: () => void
  /** Called if the delete request fails */
  onRollback?: () => void
}

export default function DeleteExperience({
  id,
  onOptimisticDelete,
  onRollback,
}: DeleteExperienceProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    // 1) Optimistically remove from UI
    onOptimisticDelete()

    try {
      setLoading(true)
      await axios.delete(`/api/me/deleteExperience?id=${id}`)
    } catch (err) {
      console.error('Delete failed, rolling back:', err)
      // 2) Roll back UI if request fails
      onRollback?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="p-3 hover:bg-gradient-to-br transition-all duration-100 hover:from-red-600 hover:via-orange-600 hover:to-purple-600 rounded-md text-black hover:text-white">
          <Trash2 className="h-4 w-4" />
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you absolutely sure you want to delete this experience?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            experience and remove it from your profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="hover:bg-gradient-to-br transition-all duration-100 bg-black hover:from-red-600 hover:via-orange-600 hover:to-purple-600 text-white"
          >
            {loading ? 'Deleting…' : 'Continue'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
