"use client"
import { AlertDialog, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Trash2 } from "lucide-react";

export default function DeleteExperience({ id }: { id: string }) {
    const handleDelete = async () => {  
        await axios.delete(`/api/me/deleteExperience?id=${id}`);
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
          <AlertDialogTitle>Are you absolutely sure you want to delete this experience?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            experience and remove it from your profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="hover:bg-gradient-to-br transition-all duration-100 bg-black hover:from-red-600 hover:via-orange-600 hover:to-purple-600 text-white">Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}