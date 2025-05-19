import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react'
import TaskStatusForm from '@/components/tasks/task-status-form'

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select(`
      *,
      assigned_by_profile:profiles!tasks_assigned_by_fkey(id, full_name),
      assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name)
    `)
    .eq('id', params.id)
    .single()
  
  if (!task) {
    redirect('/tasks')
  }
  
  // Check if user has access to this task
  if (
    profile?.role === 'admin' && task.assigned_by !== user.id ||
    profile?.role === 'operator' && task.assigned_to !== user.id
  ) {
    redirect('/tasks')
  }
  
  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Function to get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Low</Badge>
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>
      case 'high':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">High</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Task Details</h1>
        <div className="flex space-x-4">
          <Link href="/tasks">
            <Button variant="outline">Back to Tasks</Button>
          </Link>
          {profile?.role === 'admin' && (
            <>
              <Link href={`/tasks/${params.id}/edit`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <form action={`/tasks/${params.id}/delete`} method="post">
                <Button variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>
                Created on {new Date(task.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{task.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <div className="mt-1">{getStatusBadge(task.status)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Priority</h3>
                  <div className="mt-1">{getPriorityBadge(task.priority)}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {profile?.role === 'admin' ? 'Assigned To' : 'Assigned By'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile?.role === 'admin' 
                      ? task.assigned_to_profile.full_name 
                      : task.assigned_by_profile.full_name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
              <CardDescription>
                {profile?.role === 'operator' 
                  ? 'Update the status of this task' 
                  : 'Current status of this task'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.role === 'operator' ? (
                <TaskStatusForm taskId={task.id} currentStatus={task.status} />
              ) : (
                <div className="text-center py-4">
                  <div className="mb-2">
                    {task.status === 'completed' ? (
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    ) : (
                      <Clock className="h-12 w-12 text-yellow-500 mx-auto" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {task.status === 'completed' 
                      ? 'This task has been completed' 
                      : 'Waiting for operator to complete this task'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
