import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import TaskForm from "@/components/tasks/task-form"

export default async function CreateTaskPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only admins can create tasks
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get operators for assignment
  const { data: operators } = await supabase.from("profiles").select("id, full_name").eq("role", "operator")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Create New Task</h1>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
          <CardDescription>Create a new task and assign it to an operator</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskForm operators={operators || []} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
