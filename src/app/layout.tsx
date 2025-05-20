import type React from "react"
import { Inter } from "next/font/google"
import { createClient } from "@/utils/supabase/server"
import Header from "@/components/layout/header"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/lib/notification-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Task Management System",
  description: "A task management system for admins and operators",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null

  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  const userData = user
    ? {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name,
      role: profile?.role,
    }
    : null

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NotificationProvider>
            <div className="flex min-h-screen flex-col">
              <Header user={userData} />
              <main className="flex-1 p-8">{children}</main>
            </div>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}