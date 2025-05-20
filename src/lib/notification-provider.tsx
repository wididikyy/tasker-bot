"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react" // Tambahkan useRef
import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"

type Notification = {
    id: string
    title: string
    message: string
    task_id?: string
    is_read: boolean
    created_at: string
}

type NotificationContextType = {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [user, setUser] = useState<User | null>(null) // State untuk menyimpan data user
    const supabase = useRef(createClient()).current // Inisialisasi Supabase client dengan useRef

    // Dapatkan user saat komponen dimuat
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        fetchUser()
    }, [supabase]) // Bergantung pada supabase client

    const fetchNotifications = async () => {
        if (!user) {
            console.log("User not available, skipping notification fetch.")
            return
        }

        const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching notifications:", error.message)
            return
        }

        if (data) {
            setNotifications(data)
        }
    }

    useEffect(() => {
        if (user) {
            fetchNotifications()

            // Set up real-time subscription for new notifications
            const channel = supabase
                .channel("notifications_room") // Gunakan nama channel yang unik atau deskriptif
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log("New notification received:", payload.new)
                        setNotifications((current) => [payload.new as Notification, ...current])
                    },
                )
                .subscribe()

            return () => {
                console.log("Unsubscribing from notifications channel.")
                supabase.removeChannel(channel)
            }
        }
    }, [user, supabase]) // Bergantung pada user dan supabase

    const markAsRead = async (id: string) => {
        if (!user) return

        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)

        if (error) {
            console.error("Error marking notification as read:", error.message)
            return
        }

        setNotifications((current) =>
            current.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification)),
        )
    }

    const markAllAsRead = async () => {
        if (!user) return

        const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)

        if (error) {
            console.error("Error marking all notifications as read:", error.message)
            return
        }

        setNotifications((current) => current.map((notification) => ({ ...notification, is_read: true })))
    }

    const refreshNotifications = async () => {
        await fetchNotifications()
    }

    const unreadCount = notifications.filter((notification) => !notification.is_read).length

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
    }

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider")
    }
    return context
}