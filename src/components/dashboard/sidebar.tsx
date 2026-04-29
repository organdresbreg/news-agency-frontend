"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, Menu, X, Home, LogOut, Sun, Moon, Newspaper, Database, Rss, Trash2 } from "lucide-react"
import { api } from "@/lib/api-client"
import { createLogger } from "@/lib/logger"

const logger = createLogger('Sidebar')

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const { theme, setTheme } = useTheme()

    // Evitar errores de hidratación
    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleSidebar = () => setCollapsed(!collapsed)

    const handleLogout = async () => {
        try {
            await api.post('/api/v1/auth/logout', undefined);
            logger.info('Logout exitoso');
        } catch (error) {
            logger.warn('Error al cerrar sesión en el servidor', { error });
        } finally {
            localStorage.removeItem("access_token");
            router.push("/login");
        }
    };

    return (
    <div
        className={cn(
        "flex flex-col h-screen border-r bg-background transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
        )}
    >
      {/* Header del Sidebar */}
        <div className="p-4 flex items-center justify-between border-b">
        {!collapsed && (
            <span className="font-bold text-lg text-primary">Agencia AI</span>
        )}
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
        >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
        </div>

      {/* Navegación */}
        <div className="flex-1 p-2 space-y-1">
        <Link href="/home">
            <Button
            variant={pathname === "/home" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Home</span>}
            </Button>
        </Link>
        <Link href="/chat">
            <Button
            variant={pathname === "/chat" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <MessageSquare className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Chat</span>}
            </Button>
        </Link>
        <Link href="/news">
            <Button
            variant={pathname === "/news" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <Newspaper className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Noticias</span>}
            </Button>
        </Link>
        <Link href="/entities">
            <Button
            variant={pathname === "/entities" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <Database className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Entidades</span>}
            </Button>
        </Link>
        <Link href="/sources">
            <Button
            variant={pathname === "/sources" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <Rss className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Fuentes</span>}
            </Button>
        </Link>
        <Link href="/trash">
            <Button
            variant={pathname === "/trash" ? "secondary" : "ghost"}
            className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center px-0"
            )}
            >
            <Trash2 className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Papelera</span>}
            </Button>
        </Link>
        </div>

      {/* Theme Toggle & Logout */}
        <div className="p-2 border-t mt-auto space-y-1">
            {mounted && (
                <Button
                    variant="ghost"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className={cn(
                        "w-full justify-start gap-2",
                        collapsed && "justify-center px-0"
                    )}
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4 shrink-0 text-yellow-500" />
                    ) : (
                        <Moon className="h-4 w-4 shrink-0 text-slate-700" />
                    )}
                    {!collapsed && <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>}
                </Button>
            )}
            
            <Button
                variant="ghost"
                onClick={handleLogout}
                className={cn(
                    "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
                    collapsed && "justify-center px-0"
                )}
            >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Cerrar sesión</span>}
            </Button>
        </div>
    </div>
    )
}