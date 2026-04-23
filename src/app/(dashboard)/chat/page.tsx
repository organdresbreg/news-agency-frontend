// src/app/(dashboard)/chat/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export default function ChatPage() {
    const router = useRouter()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Referencias para los tokens
    const sessionTokenRef = useRef<string | null>(null)

    // 1. Inicialización: Autenticación y Sesión
    useEffect(() => {
        const initChat = async () => {
            const userToken = localStorage.getItem("access_token")
            if (!userToken) {
                router.push("/login")
                return
            }

            try {
                // Crear o recuperar sesión
                const sessionResponse = await fetch("http://localhost:8000/api/v1/auth/session", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${userToken}` }
                })

                if (!sessionResponse.ok) throw new Error("Error al crear sesión")
                
                const sessionData = await sessionResponse.json()
                sessionTokenRef.current = sessionData.token.access_token

                // Cargar historial
                const historyResponse = await fetch("http://localhost:8000/api/v1/chatbot/messages", {
                    headers: { "Authorization": `Bearer ${sessionTokenRef.current}` }
                })

                if (historyResponse.ok) {
                    const historyData = await historyResponse.json()
                    setMessages(historyData.messages || [])
                }
            } catch (error) {
                console.error("Error inicializando chat:", error)
            } finally {
                setIsInitializing(false)
            }
        }

        initChat()
    }, [router])

    // Scroll automático al final
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading || !sessionTokenRef.current) return

        const userMessage: Message = { role: 'user', content: inputValue }
        setMessages(prev => [...prev, userMessage])
        setInputValue("")
        setIsLoading(true)

        // Preparar mensaje del asistente (vacío inicialmente)
        setMessages(prev => [...prev, { role: 'assistant', content: "" }])

        try {
            const response = await fetch("http://localhost:8000/api/v1/chatbot/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionTokenRef.current}`
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage].filter(m => m.content.trim() !== "")
                })
            })

            if (!response.ok) throw new Error("Error en el stream")

            const reader = response.body?.getReader()
            if (!reader) return

            const decoder = new TextDecoder()
            let assistantContent = ""

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split("\n")

                for (const line of lines) {
                    const trimmedLine = line.trim()
                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const jsonStr = trimmedLine.slice(6)
                            const data = JSON.parse(jsonStr)
                            
                            if (data.done) continue
                            
                            if (data.content) {
                                assistantContent += data.content
                                // Actualizar el estado con el contenido acumulado
                                setMessages(prev => {
                                    const newMessages = [...prev]
                                    const lastMsg = newMessages[newMessages.length - 1]
                                    if (lastMsg && lastMsg.role === 'assistant') {
                                        lastMsg.content = assistantContent
                                    }
                                    return newMessages
                                })
                            }
                        } catch (e) {
                            console.warn("Error parseando chunk:", e, trimmedLine)
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error en el chat:", error)
            setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, ocurrió un error al procesar tu solicitud." }])
        } finally {
            setIsLoading(false)
        }
    }

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto p-4">
            {/* Área de Mensajes */}
            <ScrollArea 
                className="flex-1 mb-4 pr-4 border border-slate-200 dark:border-slate-800 rounded-lg bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm p-4 shadow-inner"
                viewportRef={scrollRef}
            >
                <div className="space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
                            <p className="text-lg font-medium">¡Hola! Soy tu Agencia de Noticias Multi-Agente.</p>
                            <p className="text-sm">¿Sobre qué tema te gustaría que investigue hoy?</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.content === "" && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input de Envío */}
            <div className="flex gap-3 items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
                <Input
                    placeholder="Escribí tu consulta aquí..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                    className="flex-1 h-12 border-none bg-transparent focus-visible:ring-0 text-base"
                    disabled={isLoading}
                />
                <Button 
                    onClick={handleSend} 
                    size="icon" 
                    className="h-12 w-12 shrink-0 bg-indigo-600 hover:bg-indigo-700 transition-all rounded-lg"
                    disabled={isLoading || !inputValue.trim()}
                >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    )
}