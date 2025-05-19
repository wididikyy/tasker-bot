import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

interface TaskWithProfiles {
  id: string
  title: string
  description: string
  due_date: string
  status: string
  priority: string
  assigned_by: string
  assigned_to: string
  created_at: string
  updated_at: string
  assigned_to_profile: {
    full_name: string
    email: string
  }
  assigned_by_profile?: {
    full_name: string
    email: string
  }
}

export async function GET() {
  const supabase = createClient()

  try {
    // Get all pending, in_progress, and recently completed tasks
    const { data: tasks, error } = await supabase
      .from("tasks")
      .select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(full_name, email),
        assigned_by_profile:profiles!tasks_assigned_by_fkey(full_name, email)
      `)
      .or(
        `status.in.(pending,in_progress),and(status.eq.completed,updated_at.gte.${new Date(
          Date.now() - 24 * 60 * 60 * 1000,
        ).toISOString()})`,
      )

    if (error) {
      throw error
    }

    const today = new Date()
    const reports = []
    const tasksList = (tasks as TaskWithProfiles[]) || []

    // Check each task
    for (const task of tasksList) {
      const dueDate = new Date(task.due_date)

      // Check if task is completed (and was recently updated)
      if (task.status === "completed") {
        // Check if we already sent a completion report for this task
        const { data: existingReports } = await supabase
          .from("task_reports")
          .select("*")
          .eq("task_id", task.id)
          .eq("status", "completed")
          .limit(1)

        // Only send a completion report if we haven't already
        if (!existingReports || existingReports.length === 0) {
          // Generate congratulatory message using Gemini AI
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

          const prompt = `
            Generate a congratulatory message for an admin named ${task.assigned_by_profile?.full_name || "admin"} 
            about a task that was completed by ${task.assigned_to_profile.full_name}. 
            The task title is "${task.title}". The message should be concise 
            (maximum 2 sentences) and positive in tone.
          `

          const result = await model.generateContent(prompt)
          const message = result.response.text()

          // Create a report
          const { data: report, error: reportError } = await supabase
            .from("task_reports")
            .insert({
              task_id: task.id,
              status: "completed",
              message: message,
              sent_to_operator: false, // This report is for the admin
            })
            .select()

          if (reportError) {
            console.error("Error creating completion report:", reportError)
          } else if (report) {
            reports.push(report)
          }
        }
      }
      // Check if task is overdue
      else if (dueDate < today && task.status !== "overdue") {
        // Update task status to overdue
        await supabase
          .from("tasks")
          .update({ status: "overdue", updated_at: new Date().toISOString() })
          .eq("id", task.id)

        // Generate report message using Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
          Generate a friendly reminder message for an operator named ${task.assigned_to_profile.full_name} 
          about an overdue task. The task title is "${task.title}" and it was due on 
          ${new Date(task.due_date).toLocaleDateString()}. The message should be concise 
          (maximum 2 sentences) and encourage them to complete the task as soon as possible.
        `

        const result = await model.generateContent(prompt)
        const message = result.response.text()

        // Create a report
        const { data: report, error: reportError } = await supabase
          .from("task_reports")
          .insert({
            task_id: task.id,
            status: "overdue",
            message: message,
            sent_to_operator: true,
          })
          .select()

        if (reportError) {
          console.error("Error creating report:", reportError)
        } else if (report) {
          reports.push(report)
        }
      }
      // Check if task is due today
      else if (
        dueDate.getDate() === today.getDate() &&
        dueDate.getMonth() === today.getMonth() &&
        dueDate.getFullYear() === today.getFullYear() &&
        task.status !== "completed"
      ) {
        // Generate reminder message using Gemini AI
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const prompt = `
          Generate a friendly reminder message for an operator named ${task.assigned_to_profile.full_name} 
          about a task that is due today. The task title is "${task.title}". The message should be concise 
          (maximum 2 sentences) and remind them to complete the task today.
        `

        const result = await model.generateContent(prompt)
        const message = result.response.text()

        // Create a report
        const { data: report, error: reportError } = await supabase
          .from("task_reports")
          .insert({
            task_id: task.id,
            status: task.status,
            message: message,
            sent_to_operator: true,
          })
          .select()

        if (reportError) {
          console.error("Error creating report:", reportError)
        } else if (report) {
          reports.push(report)
        }
      }
    }

    return NextResponse.json({ success: true, reports })
  } catch (error) {
    console.error("Error checking tasks:", error)
    return NextResponse.json({ success: false, error: "Failed to check tasks" }, { status: 500 })
  }
}
