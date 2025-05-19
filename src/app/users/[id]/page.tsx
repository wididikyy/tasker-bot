import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import UserRoleForm from "@/components/users/user-role-form"

export default async function UserDetailPage({
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

  // Only admins can access this page
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Get user details
  const { data: targetUser } = await supabase.from("profiles").select("*").eq("id", params.id).single()

  if (!targetUser) {
    redirect("/users")
  }

  // Get user's tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq(targetUser.role === "admin" ? "assigned_by" : "assigned_to", params.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Link href="/users">
          <Button variant="outline">Back to Users</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{targetUser.full_name}</CardTitle>
              <CardDescription>User profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Role</h3>
                  <div className="mt-1">
                    <Badge variant={targetUser.role === "admin" ? "default" : "outline"}>
                      {targetUser.role === "admin" ? "Administrator" : "Operator"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="mt-1 text-sm text-gray-900">{new Date(targetUser.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Tasks</h3>
                {tasks && tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {tasks.map((task) => (
                      <li key={task.id} className="text-sm">
                        <Link href={`/tasks/${task.id}`} className="text-blue-600 hover:underline">
                          {task.title}
                        </Link>
                        <span className="text-gray-500 ml-2">({new Date(task.created_at).toLocaleDateString()})</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No recent tasks</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>User Role</CardTitle>
              <CardDescription>Change the user's role</CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleForm userId={params.id} currentRole={targetUser.role} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
