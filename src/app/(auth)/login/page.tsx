// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

// Componentes Shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Asegurate de tener 'alert' instalado si lo usás

// Iconos
import { Loader2 } from "lucide-react";

// Tipo de respuesta esperado del backend (ajustalo según tu API real)
interface LoginResponse {
    access_token: string;
    token_type: string;
}

// Función de llamada al backend (ajustá la URL según tu backend FastAPI)
const loginUser = async ({ email, password }: { email: string; password: string }): Promise<LoginResponse> => {
    const formData = new URLSearchParams();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("grant_type", "password");

    const response = await fetch("http://localhost:8000/api/v1/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Credenciales inválidas");
    }

    return response.json();
};

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Mutación de TanStack Query para manejar el login
    const mutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            // Guardar el token en localStorage (o cookies seguras en producción)
            localStorage.setItem("access_token", data.access_token);

            // Redirigir al dashboard o página principal
            router.push("/dashboard");
        },
        onError: (err) => {
            setError(err.message || "Ocurrió un error al iniciar sesión");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        mutation.mutate({ email, password });
    };

    return (
        <div className="flex min-h-screen items-center justify-center">
            <Card className="w-full max-w-[400px] border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl">
                <CardHeader className="space-y-2 text-center">
                    <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</CardTitle>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-5 px-8">
                        {error && (
                            <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-200">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={mutation.isPending}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:bg-slate-800 dark:border-slate-700 dark:focus:bg-slate-700 dark:text-white transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={mutation.isPending}
                                className="h-11 bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-indigo-500/20 dark:bg-slate-800 dark:border-slate-700 dark:focus:bg-slate-700 dark:text-white transition-all"
                            />
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8 pt-4">
                        <Button
                            type="submit"
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Ingresar"
                            )}
                        </Button>

                        <div className="text-sm text-center text-slate-600 dark:text-slate-400 pt-2">
                            ¿No tenés cuenta?{" "}
                            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-4 hover:underline transition-colors">
                                Registrate acá
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}