import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"

export default function JobFilters() {
  return (
    <Card className="bg-white shadow-sm mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input placeholder="Location" />
          <Input placeholder="Company" />
          <Input placeholder="Keyword" />
          {/* Add more filters as needed */}
        </div>
      </CardContent>
    </Card>
  )
} 