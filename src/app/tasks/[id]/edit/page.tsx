import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TaskForm from "@/components/tasks/task-form"

export default async function EditTaskPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only admins can edit tasks
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get task details
  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single()

  if (!task || task.assigned_by !== user.id) {
    redirect("/tasks")
  }

  // Get operators for assignment
  const { data: operators } = await supabase.from("profiles").select("id, full_name").eq("role", "operator")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Edit Task</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit Task Details</CardTitle>
          <CardDescription>Update task details and assignment</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm operators={operators || []} userId={user.id} task={task} />
        </CardContent>
      </Card>
    </div>
  )
}
