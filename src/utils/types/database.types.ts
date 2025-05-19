export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string | null
          role: 'admin' | 'operator'
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          role?: 'admin' | 'operator'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string | null
          role?: 'admin' | 'operator'
        }
      }
      tasks: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          description: string | null
          due_date: string
          status: 'pending' | 'in_progress' | 'completed' | 'overdue'
          assigned_by: string
          assigned_to: string
          priority: 'low' | 'medium' | 'high'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description?: string | null
          due_date: string
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          assigned_by: string
          assigned_to: string
          priority?: 'low' | 'medium' | 'high'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string | null
          due_date?: string
          status?: 'pending' | 'in_progress' | 'completed' | 'overdue'
          assigned_by?: string
          assigned_to?: string
          priority?: 'low' | 'medium' | 'high'
        }
      }
      task_reports: {
        Row: {
          id: string
          created_at: string
          task_id: string
          status: 'pending' | 'completed' | 'overdue'
          message: string
          sent_to_operator: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          task_id: string
          status: 'pending' | 'completed' | 'overdue'
          message: string
          sent_to_operator?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          task_id?: string
          status?: 'pending' | 'completed' | 'overdue'
          message?: string
          sent_to_operator?: boolean
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type TaskReport = Database['public']['Tables']['task_reports']['Row']
