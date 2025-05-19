import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function ReportsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get task reports
  let query = supabase
    .from("task_reports")
    .select(`
      *,
      task:tasks(
        id,
        title,
        assigned_by,
        assigned_to,
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name),
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name)
      )
    `)
    .order("created_at", { ascending: false })

  // Filter by role
  if (profile?.role === "admin") {
    query = query.eq("task.assigned_by", user.id)
  } else {
    query = query.eq("task.assigned_to", user.id)
  }

  const { data: reports, error } = await query

  if (error) {
    console.error("Error fetching reports:", error)
  }

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Overdue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Task Reports</h1>

      <Card>
        <CardHeader>
          <CardTitle>Reports History</CardTitle>
          <CardDescription>View task status updates and bot reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>{profile?.role === "admin" ? "Operator" : "Admin"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{report.task.title}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{report.message}</TableCell>
                    <TableCell>
                      {profile?.role === "admin"
                        ? report.task.assigned_to_profile.full_name
                        : report.task.assigned_by_profile.full_name}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    No reports found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
