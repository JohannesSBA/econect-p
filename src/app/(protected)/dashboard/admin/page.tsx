import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminDashboardPage() {
  // Fetch metrics from API
  const res = await fetch("/api/admin/metrics")
  const metrics = await res.json()

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div>Users: {metrics.users}</div>
          <div>Jobs: {metrics.jobs}</div>
          <div>Posts: {metrics.posts}</div>
        </CardContent>
      </Card>
    </div>
  )
} 