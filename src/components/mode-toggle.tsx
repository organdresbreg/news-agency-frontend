"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="w-9 h-9" />

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-9 h-9 border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
        >
            {theme === "dark" ? (
                <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
            ) : (
                <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700" />
            )}
            <span className="sr-only">Cambiar tema</span>
        </Button>
    )
}
