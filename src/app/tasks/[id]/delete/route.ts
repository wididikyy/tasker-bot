import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Get user profile to determine role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only admins can delete tasks
  if (profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Get task to verify ownership
  const { data: task } = await supabase.from("tasks").select("*").eq("id", params.id).single()

  if (!task || task.assigned_by !== user.id) {
    return NextResponse.redirect(new URL("/tasks", request.url))
  }

  // Delete task
  await supabase.from("tasks").delete().eq("id", params.id)

  return NextResponse.redirect(new URL("/tasks", request.url))
}
