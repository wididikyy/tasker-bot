"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface TaskBotProps {
  userName: string
  role: "admin" | "operator"
}

type ActionType = "create_task" | "update_task" | "delete_task" | null

interface ActionPerformed {
  type: ActionType
  message: string
}

interface BotResponse {
  response: string
  action?: ActionType
  task?: any
  taskId?: string
  error?: string
}

export default function TaskBot({ userName, role }: TaskBotProps) {
  const router = useRouter()
  const [message, setMessage] = useState("")
  const [conversation, setConversation] = useState<{ role: "user" | "bot"; content: string }[]>([
    {
      role: "bot",
      content: `Hello ${userName}! I'm your task assistant. How can I help you today?`,
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [actionPerformed, setActionPerformed] = useState<ActionPerformed | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages when conversation updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [conversation])

  const handleSendMessage = async () => {
    if (!message.trim()) return

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: message }])

    // Clear input
    setMessage("")

    // Set loading state
    setIsLoading(true)
    setActionPerformed(null)

    try {
      // Send message to bot API
      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response from bot")
      }

      const data = (await response.json()) as BotResponse

      // Add bot response to conversation
      setConversation((prev) => [...prev, { role: "bot", content: data.response }])

      // Check if an action was performed
      if (data.action) {
        setActionPerformed({
          type: data.action,
          message:
            data.action === "create_task"
              ? "Task created successfully!"
              : data.action === "update_task"
                ? "Task updated successfully!"
                : "Task deleted successfully!",
        })

        // Refresh the page data to show the changes
        setTimeout(() => {
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      console.error("Error sending message to bot:", error)
      setConversation((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="h-5 w-5 mr-2" />
          Task Assistant
        </CardTitle>
        <CardDescription>
          {role === "admin"
            ? "Ask questions or manage tasks with natural language"
            : "Ask questions about your tasks or get help"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 h-[300px] overflow-y-auto p-2">
          {conversation.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          {actionPerformed && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg px-4 py-2 bg-green-50 text-green-700 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                {actionPerformed.message}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full space-x-2">
          <Textarea
            placeholder={
              role === "admin" ? "Ask a question or try 'Create a task for John due tomorrow'" : "Type your message..."
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
