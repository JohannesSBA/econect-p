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

interface DeleteEducationProps {
  id: string
  onOptimisticDelete: () => void
  onRollback?: () => void
}

export default function DeleteEducation({
  id,
  onOptimisticDelete,
  onRollback,
}: DeleteEducationProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    // Optimistically remove from UI
    onOptimisticDelete()

    try {
      setLoading(true)
      await axios.delete(`/api/me/deleteEducation?id=${id}`)
    } catch (err) {
      console.error('Delete education failed, rolling back:', err)
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
            Are you sure you want to delete this education entry?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
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
