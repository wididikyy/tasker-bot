"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { User, LogOut, Menu } from "lucide-react"
import { NotificationBell } from "./notification-bell"

interface HeaderProps {
  user: {
    id: string
    email?: string
    full_name?: string
    role?: "admin" | "operator"
  } | null
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    ...(user?.role === "admin" ? [{ name: "Manage Users", href: "/users" }] : []),
    { name: "Tasks", href: "/tasks" },
    { name: "Reports", href: "/reports" },
  ]

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold text-indigo-600">
                TaskManager
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${pathname === item.href
                      ? "border-indigo-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="font-medium">{user.full_name || user.email}</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-gray-500">
                      {user.role === "admin" ? "Administrator" : "Operator"}
                    </DropdownMenuItem>
                    <form action="/auth/logout" method="post">
                      <DropdownMenuItem asChild>
                        <button className="w-full flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/register">
                  <Button>Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-screen">
                {navigation.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link
                      href={item.href}
                      className={`block px-3 py-2 text-base font-medium ${pathname === item.href
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {user ? (
                  <>
                    <DropdownMenuItem className="font-medium">{user.full_name || user.email}</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-gray-500">
                      {user.role === "admin" ? "Administrator" : "Operator"}
                    </DropdownMenuItem>
                    <form action="/auth/logout" method="post" className="w-full">
                      <DropdownMenuItem asChild>
                        <button className="w-full flex items-center">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">Log in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">Sign up</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
