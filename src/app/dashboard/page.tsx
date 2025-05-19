import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, AlertTriangle, BarChart } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import TaskBot from "@/components/bot/task-bot"

export default async function Dashboard() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get tasks statistics
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .or(profile?.role === "admin" ? `assigned_by.eq.${user.id}` : `assigned_to.eq.${user.id}`)

  const pendingTasks = tasks?.filter((task) => task.status === "pending").length || 0
  const completedTasks = tasks?.filter((task) => task.status === "completed").length || 0
  const overdueTasks = tasks?.filter((task) => task.status === "overdue").length || 0
  const totalTasks = tasks?.length || 0

  // Get today's tasks
  const today = new Date().toISOString().split("T")[0]
  const todayTasks = tasks?.filter((task) => new Date(task.due_date).toISOString().split("T")[0] === today).length || 0

  // Get recently completed tasks (last 7 days)
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)
  const recentlyCompletedTasks =
    tasks?.filter((task) => task.status === "completed" && new Date(task.updated_at) >= lastWeek).length || 0

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">
        {profile?.role === "admin" ? "Admin Dashboard" : "Operator Dashboard"}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Link href="/tasks?status=pending">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {pendingTasks > 0 ? `${pendingTasks} tasks need attention` : "No pending tasks"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tasks?status=completed">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {recentlyCompletedTasks > 0
                      ? `${recentlyCompletedTasks} completed recently`
                      : "No recently completed tasks"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tasks?status=overdue">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {overdueTasks > 0 ? `${overdueTasks} tasks overdue` : "No overdue tasks"}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tasks">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTasks}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayTasks > 0 ? `${todayTasks} tasks due today` : "No tasks due today"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {profile?.role === "admin" && (
            <div className="mb-6">
              <Link href="/tasks/create">
                <Button>Create New Task</Button>
              </Link>
            </div>
          )}

          {/* Recent tasks or activity could go here */}
        </div>

        <div>
          <TaskBot
            userName={profile?.full_name || user.email?.split("@")[0] || "User"}
            role={profile?.role || "operator"}
          />
        </div>
      </div>
    </div>
  )
}
