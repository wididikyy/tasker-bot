import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const supabase = createClient()

  // Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (authError) {
    return NextResponse.redirect(new URL(`/register?error=${encodeURIComponent(authError.message)}`, request.url))
  }

  // Create a profile for the user (default to operator role)
  if (authData.user) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      role: "operator", // Default role is operator
    })

    if (profileError) {
      return NextResponse.redirect(new URL(`/register?error=${encodeURIComponent(profileError.message)}`, request.url))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
