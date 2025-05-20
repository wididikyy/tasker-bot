"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle } from "lucide-react"

interface TaskStatusFormProps {
  taskId: string
  currentStatus: string
}

export default function TaskStatusForm({ taskId, currentStatus }: TaskStatusFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [status, setStatus] = useState(currentStatus)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)

  // Reset completion message when status changes from completed to something else
  useEffect(() => {
    if (status !== "completed") {
      setShowCompletionMessage(false)
    }
  }, [status])

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

    try {
      // Dapatkan data tugas sebelum diperbarui untuk mendapatkan assigned_by (admin)
      const { data: taskData, error: fetchTaskError } = await supabase
        .from("tasks")
        .select("title, assigned_by")
        .eq("id", taskId)
        .single();

      if (fetchTaskError) throw fetchTaskError;
      if (!taskData) {
        setError("Task not found.");
        setIsSubmitting(false);
        return;
      }

      const { title: taskTitle, assigned_by: adminId } = taskData;

      // Update task status
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)

      if (updateError) throw updateError

      // Add a task report
      const { error: reportError } = await supabase.from("task_reports").insert({
        task_id: taskId,
        status,
        message: comment || `Task status updated to ${status}`,
        sent_to_operator: false, // Ini harus tetap false jika laporan ini dari operator ke admin
      })

      if (reportError) throw reportError

      // Kirim notifikasi ke admin
      let notificationMessage = `Task "${taskTitle}" status changed to: ${status.replace(/_/g, ' ')}.`;
      if (comment) {
        notificationMessage += ` Comment: "${comment}"`;
      }

      await sendNotification(
        adminId, // Mengirim notifikasi ke admin yang menugaskan tugas
        `Task Update: ${taskTitle}`,
        notificationMessage,
        taskId
      );

      // Show completion message if task is marked as completed
      if (status === "completed") {
        setShowCompletionMessage(true)
      }

      router.refresh()
      setComment("")
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">{error}</div>}

      {showCompletionMessage && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md text-sm flex items-center mb-4">
          <CheckCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Great job!</p>
            <p>Task marked as completed. The admin will be notified.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="block text-sm font-medium">
          Comment (optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment about this status update"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Status"}
      </Button>
    </form>
  )
}