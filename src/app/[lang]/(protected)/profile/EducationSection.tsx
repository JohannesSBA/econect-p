'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditContentModal } from '../components/EditContentModal'
import DeleteEducation from '../components/DeleteEducation'
import type { User, Education } from '@/../types/prisma'
import { toast } from 'sonner'

export default function EducationSection({ user }: { user: User }) {
  // keep educations in state
  const initial = user.profile?.education || []  // rename as per your shape
  const [educations, setEducations] = useState<Education[]>(initial)
  const [backup, setBackup] = useState<Education[]>(initial)

  const handleOptimisticDelete = (id: string) => {
    setBackup(educations)
    setEducations(educations.filter((e) => e.id !== id))
  }
  const handleRollback = () => {
    toast.error('Error deleting education, please try again later.')
    setEducations(backup)
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <GraduationCap className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Education</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
          <EditContentModal type="education" user={{...user, skills: []}} />
        </Button>
      </CardHeader>

      {educations.map((edu) => (
        <CardContent key={edu.id} className="space-y-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12 mt-1">
              <AvatarFallback className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                {edu.school.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {edu.school}
              </h3>
              <p className="text-gray-600">
                {edu.degreeType}, {edu.fieldOfStudy}
              </p>
              <p className="text-sm text-gray-500">
                {edu.StartYear} – {edu.EndYear || 'Present'}
              </p>
              <div>
                <p className="text-sm text-gray-500">
              GPA: {edu.grade}
            </p>
            <p className="text-sm block text-gray-500">
              Activities: {edu.activites}
            </p>
            </div>

            </div>
            

            <DeleteEducation
              id={edu.id}
              onOptimisticDelete={() => handleOptimisticDelete(edu.id)}
              onRollback={handleRollback}
            />
          </div>
          <Separator />
        </CardContent>
      ))}

      {educations.length === 0 && (
        <CardContent>
          <p className="text-gray-500 text-center">No education entries yet.</p>
        </CardContent>
      )}
    </Card>
  )
}
