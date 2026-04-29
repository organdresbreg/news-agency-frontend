"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

import { useApiError } from "@/hooks/useApiError";
import { api } from "@/lib/api-client";
import { logger } from "@/lib/logger";

interface LoginResponse {
    access_token: string;
    token_type: string;
}

export default function LoginPage() {
    const router = useRouter();
    const { handleError } = useApiError();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email || !password) {
            handleError("Por favor, completá todos los campos");
            return;
        }

        setIsSubmitting(true);
        logger.debug("Intentando iniciar sesión", { email });

        try {
            const formData = new URLSearchParams();
            formData.append("email", email); // El backend personalizado espera 'email' explícitamente
            formData.append("password", password);
            formData.append("grant_type", "password");

            const data = await api.postForm<LoginResponse>("/api/v1/auth/login", formData);
            
            logger.info("Sesión iniciada correctamente", { email });
            localStorage.setItem("access_token", data.access_token);
            router.push("/home");
        } catch (err) {
            handleError(err, "Credenciales inválidas o error de servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Card className="w-full max-w-[400px] border-border bg-card shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    </div>
                    <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5 px-8">
                        {/* Los errores se manejan centralizadamente vía toasts */}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
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
                                    Ingresando...
                                </>
                            ) : (
                                "Ingresar"
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground pt-2">
                            ¿No tenés cuenta?{" "}
                            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline transition-colors">
                                Registrate acá
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}