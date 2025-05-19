import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Call the bot check API
    const response = await fetch(new URL("/api/bot/check-tasks", request.url), {
      method: "GET",
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error running daily check:", error)
    return NextResponse.json({ success: false, error: "Failed to run daily check" }, { status: 500 })
  }
}

// Export config for Vercel Cron
export const config = {
  runtime: "edge",
}
