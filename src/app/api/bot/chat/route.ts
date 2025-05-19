import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateContent } from "@/utils/gemini/client"

type TaskData = {
  title?: string
  description?: string
  due_date?: string
  priority?: "low" | "medium" | "high"
  status?: "pending" | "in_progress" | "completed" | "overdue"
  assigned_operator?: string
  task_id?: string
}

type CommandData = {
  command_type: "CREATE" | "UPDATE" | "DELETE" | "QUERY"
  task_data: TaskData
}

type Operator = {
  id: string
  full_name: string
}

type Task = {
  id: string
  title: string
  description: string
  due_date: string
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: "low" | "medium" | "high"
  assigned_by: string
  assigned_to: string
  created_at: string
  updated_at: string
}

// Helper function to extract JSON from a potentially markdown-formatted string
function extractJsonFromResponse(text: string): string {
  // Check if the response is wrapped in markdown code blocks
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)```/
  const match = text.match(jsonRegex)

  if (match && match[1]) {
    // Return the content inside the code block
    return match[1].trim()
  }

  // If no code blocks found, return the original text
  return text.trim()
}

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { message, role } = (await request.json()) as { message: string; role: string }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get tasks data for context
    let tasksQuery = supabase.from("tasks").select("*")

    if (profile.role === "admin") {
      tasksQuery = tasksQuery.eq("assigned_by", user.id)
    } else {
      tasksQuery = tasksQuery.eq("assigned_to", user.id)
    }

    const { data: tasks } = await tasksQuery
    const tasksList = (tasks as Task[]) || []

    // Get operators for task assignment (if admin)
    let operators: Operator[] = []
    if (profile.role === "admin") {
      const { data: operatorsData } = await supabase.from("profiles").select("id, full_name").eq("role", "operator")

      operators = (operatorsData as Operator[]) || []
    }

    // First, check if this is a task management command from an admin
    if (profile.role === "admin") {
      // Use Gemini to determine if this is a task management command and parse it
      const commandPrompt = `
        You are a task management system parser. Analyze the following message from an admin and determine if they are trying to:
        1. CREATE a new task
        2. UPDATE an existing task
        3. DELETE an existing task
        4. Just asking a question (not a command)

        If it's a command, extract the relevant details in JSON format.

        For CREATE: Extract title, description (if any), due date (interpret relative dates like "tomorrow" or "next week" relative to today: ${new Date().toLocaleDateString()}), priority (low, medium, high), and assigned operator name (if mentioned).
        
        For UPDATE: Extract task title or ID to identify which task, and any fields being updated (status, due date, priority, description, assigned operator).
        
        For DELETE: Extract task title or ID to identify which task to delete.

        Message: "${message}"

        Available operators: ${operators.map((op) => op.full_name).join(", ")}
        
        Respond with JSON only, without any markdown formatting, in this format:
        {
          "command_type": "CREATE" | "UPDATE" | "DELETE" | "QUERY",
          "task_data": {
            // Relevant fields based on command type
          }
        }

        Do not include any explanations, markdown formatting, or code blocks. Return only the raw JSON object.
      `

      const commandResponse = await generateContent(commandPrompt)
      let commandData: CommandData

      try {
        // Extract JSON from potentially markdown-formatted response
        const jsonString = extractJsonFromResponse(commandResponse)
        console.log("Extracted JSON string:", jsonString)

        commandData = JSON.parse(jsonString) as CommandData
      } catch (e) {
        console.error("Failed to parse command response:", e)
        console.error("Raw response:", commandResponse)
        commandData = { command_type: "QUERY", task_data: {} }
      }

      // Handle the command based on type
      if (commandData.command_type === "CREATE") {
        return await handleCreateTask(supabase, user.id, commandData.task_data, operators)
      } else if (commandData.command_type === "UPDATE") {
        return await handleUpdateTask(supabase, user.id, commandData.task_data, tasksList, operators)
      } else if (commandData.command_type === "DELETE") {
        return await handleDeleteTask(supabase, user.id, commandData.task_data, tasksList)
      }
    }

    // If not a command or not an admin, proceed with regular chat
    const prompt = `
      You are a helpful task management assistant. The user is a ${profile.role} named ${profile.full_name}.
      
      ${
        profile.role === "admin"
          ? "They manage tasks and assign them to operators. They can ask you to create, update, or delete tasks."
          : "They are assigned tasks by admins and need to complete them."
      }
      
      Current tasks information:
      ${
        tasksList.length > 0
          ? tasksList
              .map(
                (task) =>
                  `- Task: ${task.title}, Status: ${task.status}, Due: ${new Date(task.due_date).toLocaleDateString()}`,
              )
              .join("\n")
          : "No tasks available."
      }
      
      Today's date is ${new Date().toLocaleDateString()}.
      
      The user's message is: "${message}"
      
      Provide a helpful, concise response. If they ask about task status, due dates, or need help with task management, use the context provided.
      If they ask something you don't have information about, politely explain that you can only help with task-related queries.
      ${profile.role === "admin" ? "If they want to manage tasks, remind them they can ask you to create, update, or delete tasks." : ""}
      Keep your response under 150 words.
    `

    // Generate response with Gemini AI
    const response = await generateContent(prompt)

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in bot chat:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}

// Helper function to handle task creation
async function handleCreateTask(supabase: any, userId: string, taskData: TaskData, operators: Operator[]) {
  try {
    // Find the operator ID based on name
    let operatorId = null
    if (taskData.assigned_operator) {
      const matchedOperator = operators.find((op) =>
        op.full_name.toLowerCase().includes(taskData.assigned_operator?.toLowerCase() || ""),
      )
      if (matchedOperator) {
        operatorId = matchedOperator.id
      }
    }

    // If no operator found, use the first one (fallback)
    if (!operatorId && operators.length > 0) {
      operatorId = operators[0].id
    }

    if (!operatorId) {
      return NextResponse.json({
        response:
          "I couldn't find an operator to assign this task to. Please specify an operator name or add operators to the system first.",
      })
    }

    // Parse due date
    let dueDate = new Date()
    if (taskData.due_date) {
      if (taskData.due_date.toLowerCase() === "tomorrow") {
        dueDate.setDate(dueDate.getDate() + 1)
      } else if (taskData.due_date.toLowerCase().includes("next week")) {
        dueDate.setDate(dueDate.getDate() + 7)
      } else if (taskData.due_date.toLowerCase().includes("next month")) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      } else {
        // Try to parse the date
        const parsedDate = new Date(taskData.due_date)
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate
        }
      }
    } else {
      // Default to a week from now if no date specified
      dueDate.setDate(dueDate.getDate() + 7)
    }

    // Create the task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title: taskData.title || "New Task",
        description: taskData.description || "",
        due_date: dueDate.toISOString(),
        status: "pending",
        priority: taskData.priority || "medium",
        assigned_by: userId,
        assigned_to: operatorId,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Generate a confirmation message
    const confirmationPrompt = `
      Generate a confirmation message for creating a new task with the following details:
      - Title: ${taskData.title || "New Task"}
      - Due date: ${dueDate.toLocaleDateString()}
      - Priority: ${taskData.priority || "medium"}
      - Assigned to: ${operators.find((op) => op.id === operatorId)?.full_name || "an operator"}
      
      Keep it concise and friendly.
    `

    const confirmationMessage = await generateContent(confirmationPrompt)

    return NextResponse.json({
      response: confirmationMessage,
      action: "create_task",
      task: task,
    })
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json({
      response: `I encountered an error while trying to create the task: ${error.message}. Please try again with clearer instructions.`,
    })
  }
}

// Helper function to handle task updates
async function handleUpdateTask(
  supabase: any,
  userId: string,
  taskData: TaskData,
  tasks: Task[],
  operators: Operator[],
) {
  try {
    // Find the task to update
    let taskToUpdate = null

    if (taskData.task_id) {
      taskToUpdate = tasks.find((t) => t.id === taskData.task_id)
    } else if (taskData.title) {
      taskToUpdate = tasks.find((t) => t.title.toLowerCase().includes(taskData.title?.toLowerCase() || ""))
    }

    if (!taskToUpdate) {
      return NextResponse.json({
        response: "I couldn't find the task you want to update. Please specify the task title more clearly.",
      })
    }

    // Prepare update data
    const updateData: Record<string, any> = {}

    if (taskData.title && taskData.title !== taskToUpdate.title) {
      updateData.title = taskData.title
    }

    if (taskData.description) {
      updateData.description = taskData.description
    }

    if (taskData.status && ["pending", "in_progress", "completed", "overdue"].includes(taskData.status)) {
      updateData.status = taskData.status
    }

    if (taskData.priority && ["low", "medium", "high"].includes(taskData.priority)) {
      updateData.priority = taskData.priority
    }

    if (taskData.due_date) {
      let dueDate = new Date()
      if (taskData.due_date.toLowerCase() === "tomorrow") {
        dueDate.setDate(dueDate.getDate() + 1)
      } else if (taskData.due_date.toLowerCase().includes("next week")) {
        dueDate.setDate(dueDate.getDate() + 7)
      } else if (taskData.due_date.toLowerCase().includes("next month")) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      } else {
        // Try to parse the date
        const parsedDate = new Date(taskData.due_date)
        if (!isNaN(parsedDate.getTime())) {
          dueDate = parsedDate
        }
      }
      updateData.due_date = dueDate.toISOString()
    }

    if (taskData.assigned_operator) {
      const matchedOperator = operators.find((op) =>
        op.full_name.toLowerCase().includes(taskData.assigned_operator?.toLowerCase() || ""),
      )
      if (matchedOperator) {
        updateData.assigned_to = matchedOperator.id
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        response: "I didn't detect any changes to make to the task. Please specify what you want to update.",
      })
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update the task
    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskToUpdate.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    // Generate a confirmation message
    const confirmationPrompt = `
      Generate a confirmation message for updating a task with the following details:
      - Original task: ${taskToUpdate.title}
      ${updateData.title ? `- New title: ${updateData.title}` : ""}
      ${updateData.status ? `- New status: ${updateData.status}` : ""}
      ${updateData.priority ? `- New priority: ${updateData.priority}` : ""}
      ${updateData.due_date ? `- New due date: ${new Date(updateData.due_date).toLocaleDateString()}` : ""}
      ${
        updateData.assigned_to
          ? `- Newly assigned to: ${operators.find((op) => op.id === updateData.assigned_to)?.full_name}`
          : ""
      }
      
      Keep it concise and friendly.
    `

    const confirmationMessage = await generateContent(confirmationPrompt)

    return NextResponse.json({
      response: confirmationMessage,
      action: "update_task",
      task: updatedTask,
    })
  } catch (error: any) {
    console.error("Error updating task:", error)
    return NextResponse.json({
      response: `I encountered an error while trying to update the task: ${error.message}. Please try again with clearer instructions.`,
    })
  }
}

// Helper function to handle task deletion
async function handleDeleteTask(supabase: any, userId: string, taskData: TaskData, tasks: Task[]) {
  try {
    // Find the task to delete
    let taskToDelete = null

    if (taskData.task_id) {
      taskToDelete = tasks.find((t) => t.id === taskData.task_id)
    } else if (taskData.title) {
      taskToDelete = tasks.find((t) => t.title.toLowerCase().includes(taskData.title?.toLowerCase() || ""))
    }

    if (!taskToDelete) {
      return NextResponse.json({
        response: "I couldn't find the task you want to delete. Please specify the task title more clearly.",
      })
    }

    // Delete the task
    const { error } = await supabase.from("tasks").delete().eq("id", taskToDelete.id)

    if (error) {
      throw error
    }

    // Generate a confirmation message
    const confirmationPrompt = `
      Generate a confirmation message for deleting a task with the title "${taskToDelete.title}".
      Keep it concise and friendly.
    `

    const confirmationMessage = await generateContent(confirmationPrompt)

    return NextResponse.json({
      response: confirmationMessage,
      action: "delete_task",
      taskId: taskToDelete.id,
    })
  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({
      response: `I encountered an error while trying to delete the task: ${error.message}. Please try again with clearer instructions.`,
    })
  }
}
