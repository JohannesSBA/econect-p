// components/ExperienceSection.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Briefcase } from 'lucide-react'
import { EditContentModal } from '../components/EditContentModal'
import DeleteExperience from '../components/DeleteExperience'
import type { User, Experience } from '@/../types/prisma'

export default function ExperienceSection({ user }: { user: User }) {
  // keep experiences in local state
  const [experiences, setExperiences] = useState<Experience[]>(
    user.profile?.experiences || []
  )
  // keep a backup for rollback
  const [backup, setBackup] = useState<Experience[]>(experiences)

  const handleOptimisticDelete = (id: string) => {
    setBackup(experiences)
    setExperiences(experiences.filter((e) => e.id !== id))
  }

  const handleRollback = () => {
    setExperiences(backup)
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Experience</CardTitle>
        </div>
        <EditContentModal type="experience" user={{...user, skills: []}} />
      </CardHeader>

      {experiences.map((exp) => (
        <CardContent key={exp.id} className="space-y-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12 mt-1">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {exp.company.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {exp.title}
              </h3>
              <p className="text-blue-600 font-medium">{exp.company}</p>
              <p className="text-sm text-gray-500 mb-2">
                {new Date(exp.startDate).toLocaleDateString()} —{' '}
                {exp.endDate
                  ? new Date(exp.endDate!).toLocaleDateString()
                  : 'Present'}
              </p>
              <p className="text-gray-700 text-sm">{exp.description}</p>
            </div>

            <DeleteExperience
              id={exp.id}
              onOptimisticDelete={() => handleOptimisticDelete(exp.id)}
              onRollback={handleRollback}
            />
          </div>

          <Separator />
        </CardContent>
      ))}

      {experiences.length === 0 && (
        <CardContent>
          <p className="text-gray-500 text-center">No experience added yet.</p>
        </CardContent>
      )}
    </Card>
  )
}
