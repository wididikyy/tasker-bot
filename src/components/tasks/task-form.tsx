"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Operator {
  id: string
  full_name: string
}

interface TaskFormProps {
  operators: Operator[]
  userId: string
  task?: {
    id: string
    title: string
    description: string
    due_date: string
    priority: "low" | "medium" | "high"
    assigned_to: string
  }
}

export default function TaskForm({ operators, userId, task }: TaskFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.due_date ? new Date(task.due_date) : undefined)
  const [priority, setPriority] = useState<"low" | "medium" | "high">(task?.priority || "medium")
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fungsi untuk mengirim notifikasi
  const sendNotification = async (recipientId: string, notificationTitle: string, notificationMessage: string, taskId?: string) => {
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: recipientId,
      title: notificationTitle,
      message: notificationMessage,
      task_id: taskId || null,
      is_read: false,
    })

    if (notificationError) {
      console.error("Error sending notification:", notificationError.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!title || !dueDate || !assignedTo) {
      setError("Please fill in all required fields")
      setIsSubmitting(false)
      return
    }

    try {
      let taskId: string | undefined

      if (task) {
        // Update existing task
        const { data, error } = await supabase
          .from("tasks")
          .update({
            title,
            description,
            due_date: dueDate.toISOString(),
            priority,
            assigned_to: assignedTo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", task.id)
          .select("id") // Pilih ID untuk digunakan di notifikasi

        if (error) throw error
        taskId = data?.[0]?.id

        // Kirim notifikasi update
        const assignedOperator = operators.find(op => op.id === assignedTo);
        const operatorName = assignedOperator ? assignedOperator.full_name : "operator";
        await sendNotification(
          assignedTo,
          "Task Updated!",
          `Task "${title}" has been updated and assigned to ${operatorName}.`,
          taskId
        );

      } else {
        // Create new task
        const { data, error } = await supabase.from("tasks").insert({
          title,
          description,
          due_date: dueDate.toISOString(),
          status: "pending",
          priority,
          assigned_by: userId,
          assigned_to: assignedTo,
        }).select("id"); // Pilih ID untuk digunakan di notifikasi

        if (error) throw error
        taskId = data?.[0]?.id;

        // Kirim notifikasi tugas baru
        const assignedOperator = operators.find(op => op.id === assignedTo);
        const operatorName = assignedOperator ? assignedOperator.full_name : "operator";
        await sendNotification(
          assignedTo,
          "New Task Assigned!",
          `You have been assigned a new task: "${title}". Due: ${format(dueDate, "PPP")}.`,
          taskId
        );
      }

      router.push("/tasks")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium">
          Title *
        </label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Due Date *</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Priority</label>
          <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Assign To *</label>
        <Select value={assignedTo} onValueChange={setAssignedTo}>
          <SelectTrigger>
            <SelectValue placeholder="Select an operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((operator) => (
              <SelectItem key={operator.id} value={operator.id}>
                {operator.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : task ? "Update Task" : "Create Task"}
        </Button>
      </div>
    </form>
  )
}