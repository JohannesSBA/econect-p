"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Upload, FileText, Calendar, MapPin, GraduationCap, Award, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface EditContentModalProps {
  user: { profile: { bio: string }; skills: string[]; id: string }
  type: "about" | "experience" | "education" | "skills" | "resume"
  children?: React.ReactNode
  onUpdate?: () => void
}

export function EditContentModal({ type, children, onUpdate, user }: EditContentModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [resume, setResume] = useState<string | null>(null)

  // Form states
  const [aboutText, setAboutText] = useState("")
  const [experienceForm, setExperienceForm] = useState({
    jobTitle: "",
    company: "",
    location: "",
    employmentType: "",
    startDate: new Date(),
    endDate: "",
    description: "",
    current: false,
  })
  const [educationForm, setEducationForm] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    grade: "",
    startYear: "",
    endYear: "",
    activities: "",
  })



  

    // Load initial data when modal opens
  useEffect(() => {
    const loadInitialData = async () => {
    setLoading(true)
    try {
      switch (type) {
        case "about":
          const profile = user.profile
          setAboutText(profile.bio)
          break
        case "skills":
          const skillsData = user.skills
          setSkills(skillsData)
          break
        case "resume":
          const resumeData = user.id
          setResume(resumeData)
          break
      }
    } catch (error) {
        console.log(error);
        toast.error("Failed to load data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

    if (open) {
      loadInitialData();
    }
  }, [open, type])

  const handleSave = async () => {
    setLoading(true)
    try {
      switch (type) {
        case "about":
            await axios.post("/api/me/profile", { about: aboutText })
          toast.success("About section updated successfully!")
          break

        case "experience":
          if (!experienceForm.jobTitle || !experienceForm.company || !experienceForm.startDate) {
            toast.error("Please fill in all required fields.")
            return
          }
          await axios.post("/api/me/newExperience", {
            ...experienceForm,
            startDate: new Date(experienceForm.startDate),
            endDate: experienceForm.endDate ? Number.parseInt(experienceForm.endDate) : undefined,
          })
          toast.success("Experience added successfully!")
          break

        case "education":
          if (!educationForm.school) {
            toast.error("Please fill in all required fields.")
            return
          }
          await axios.post("/api/me/education", {
            ...educationForm,
            startYear: Number.parseInt(educationForm.startYear) || 0,
            endYear: educationForm.endYear ? Number.parseInt(educationForm.endYear) : undefined,
          })
          toast.success("Education added successfully!")
          break

        case "skills":
          await axios.post("/api/me/skills", { skills })
          toast.success("Skills updated successfully!")
          break
      }

      setOpen(false)
      onUpdate?.()
    } catch (error) {
        console.log(error);
      toast.error("Failed to save changes. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload a PDF, DOC, or DOCX file.")
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.")
      return
    }

    setLoading(true)
    try {
        const uploadedResume = await axios.post("/api/resume", { file })
      setResume(uploadedResume.data)
      toast.success("Resume uploaded successfully!")
    } catch (error) {
        console.log(error);
      toast.error("Failed to upload resume. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResume = async () => {
    setLoading(true)
    try {
      await axios.delete("/api/resume")
      setResume(null)
      toast.success("Resume deleted successfully!")
    } catch (error) {
        console.log(error);
      toast.error("Failed to delete resume. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getModalContent = () => {
    if (loading && type !== "resume") {
      return {
        title: "Loading...",
        content: (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ),
      }
    }

    switch (type) {
      case "about":
        return {
          title: "Edit About Section",
          content: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                  className="min-h-[200px] mt-2"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Write a compelling summary that highlights your professional background and goals.
                </p>
              </div>
            </div>
          ),
        }

      case "experience":
        return {
          title: "Add Work Experience",
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Software Engineer"
                    className="mt-1"
                    value={experienceForm.jobTitle}
                    onChange={(e) => setExperienceForm({ ...experienceForm, jobTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Econnect"
                    className="mt-1"
                    value={experienceForm.company}
                    onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="location"
                      placeholder="e.g. Addis Ababa, Ethiopia"
                      className="pl-10"
                      value={experienceForm.location}
                      onChange={(e) => setExperienceForm({ ...experienceForm, location: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={experienceForm.employmentType}
                    onValueChange={(value) => setExperienceForm({ ...experienceForm, employmentType: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="startDate"
                      type="month"
                      className="pl-10"
                      value={experienceForm.startDate.toISOString()}
                      onChange={(e) => setExperienceForm({ ...experienceForm, startDate: new Date(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="endDate"
                      type="month"
                      className="pl-10"
                      placeholder="Present if current"
                      value={experienceForm.endDate}
                      onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                      disabled={experienceForm.current}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="current"
                  checked={experienceForm.current}
                  onCheckedChange={(checked) =>
                    setExperienceForm({
                      ...experienceForm,
                      current: checked as boolean,
                      endDate: checked ? "" : experienceForm.endDate,
                    })
                  }
                />
                <Label htmlFor="current" className="text-sm">
                  I currently work here
                </Label>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your responsibilities, achievements, and key projects..."
                  className="min-h-[120px] mt-1"
                  value={experienceForm.description}
                  onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use bullet points to highlight your key accomplishments and responsibilities.
                </p>
              </div>
            </div>
          ),
        }

      case "education":
        return {
          title: "Add Education",
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="school">School/University *</Label>
                  <div className="relative mt-1">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="school"
                      placeholder="e.g. Addis Ababa University"
                      className="pl-10"
                      value={educationForm.school}
                      onChange={(e) => setEducationForm({ ...educationForm, school: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="degree">Degree</Label>
                  <Select
                    value={educationForm.degree}
                    onValueChange={(value) => setEducationForm({ ...educationForm, degree: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelor">Bachelor&apos;s Degree</SelectItem>
                      <SelectItem value="master">Master&apos;s Degree</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                      <SelectItem value="diploma">Diploma</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fieldOfStudy">Field of Study</Label>
                  <Input
                    id="fieldOfStudy"
                    placeholder="e.g. Computer Science"
                    className="mt-1"
                    value={educationForm.fieldOfStudy}
                    onChange={(e) => setEducationForm({ ...educationForm, fieldOfStudy: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade/GPA</Label>
                  <Input
                    id="grade"
                    placeholder="e.g. 3.8/4.0"
                    className="mt-1"
                    value={educationForm.grade}
                    onChange={(e) => setEducationForm({ ...educationForm, grade: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startYear">Start Year</Label>
                  <Input
                    id="startYear"
                    type="number"
                    placeholder="e.g. 2020"
                    className="mt-1"
                    value={educationForm.startYear}
                    onChange={(e) => setEducationForm({ ...educationForm, startYear: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endYear">End Year</Label>
                  <Input
                    id="endYear"
                    type="number"
                    placeholder="e.g. 2024"
                    className="mt-1"
                    value={educationForm.endYear}
                    onChange={(e) => setEducationForm({ ...educationForm, endYear: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="activities">Activities and Societies</Label>
                <Textarea
                  id="activities"
                  placeholder="List any clubs, organizations, or activities you participated in..."
                  className="min-h-[100px] mt-1"
                  value={educationForm.activities}
                  onChange={(e) => setEducationForm({ ...educationForm, activities: e.target.value })}
                />
              </div>
            </div>
          ),
        }

      case "skills":
        return {
          title: "Manage Skills",
          content: (
            <div className="space-y-4">
              <div>
                <Label htmlFor="newSkill">Add New Skill</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="newSkill"
                    placeholder="e.g. JavaScript, Project Management, etc."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addSkill()}
                  />
                  <Button onClick={addSkill} className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <Label>Your Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 pr-1">
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="ml-2 hover:text-red-600 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {skills.length === 0 && (
                  <p className="text-gray-500 text-sm mt-2">No skills added yet. Add your first skill above!</p>
                )}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Skill Recommendations</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Add skills that are relevant to your industry and the jobs you&apos;re interested in. Include both
                        technical and soft skills.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
        }

      case "resume":
        return {
          title: "Upload Resume",
          content: (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your resume</h3>
                <p className="text-gray-600 mb-4">Drag and drop your resume here, or click to browse</p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
              </div>

              {resume && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">Current Resume</p>
                          <p className="text-sm text-gray-500">{resume}</p>
                          <p className="text-xs text-gray-400">
                            Uploaded on {new Date(resume).toLocaleDateString()} •{" "}
                            {/* {Math.round(resume.size / 1024)} KB */}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                          onClick={handleDeleteResume}
                          disabled={loading}
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <FileText className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Resume Tips</h4>
                      <ul className="text-sm text-green-700 mt-1 space-y-1">
                        <li>• Keep it to 1-2 pages maximum</li>
                        <li>• Use a clean, professional format</li>
                        <li>• Include relevant keywords for your industry</li>
                        <li>• Update it regularly with new experiences</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ),
        }

      default:
        return { title: "Edit Content", content: <div>Content not found</div> }
    }
  }

  const { title, content } = getModalContent()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">{content}</div>
        {type !== "resume" && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
