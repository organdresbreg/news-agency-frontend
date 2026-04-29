"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

import { useApiError } from "@/hooks/useApiError"
import { api } from "@/lib/api-client"
import { logger } from "@/lib/logger"

interface RegisterResponse {
    message: string
}

export default function RegisterPage() {
    const router = useRouter()
    const { handleError } = useApiError()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validación unificada
        if (!name || !email || !password || !confirmPassword) {
            handleError("Por favor, completá todos los campos")
            return
        }

        if (password !== confirmPassword) {
            handleError("Las contraseñas no coinciden")
            return
        }

        if (password.length < 8) {
            handleError("La contraseña debe tener al menos 8 caracteres")
            return
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
            handleError("La contraseña debe incluir mayúscula, minúscula, número y símbolo")
            return
        }

        setIsSubmitting(true)
        logger.debug("Intentando registrar usuario", { username: name, email })

        try {
            await api.post<RegisterResponse>("/api/v1/auth/register", {
                username: name,
                email,
                password
            })
            
            logger.info("Usuario registrado correctamente", { username: name, email })
            router.push("/login")
        } catch (err) {
            handleError(err, "Error al registrarse. Verificá los datos.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Card className="w-full max-w-[400px] border-border bg-card shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5 px-8">
                        {/* Los errores se manejan centralizadamente vía toasts */}

                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={isSubmitting}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all duration-200"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                "Registrarse"
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground pt-2">
                            ¿Ya tenés cuenta?{" "}
                            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-colors">
                                Iniciá sesión acá
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}