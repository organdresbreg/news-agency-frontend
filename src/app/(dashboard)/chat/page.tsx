// src/app/(dashboard)/chat/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { api, getAuthHeaders } from "@/lib/api-client"
import { createLogger } from "@/lib/logger"
import { useApiError } from "@/hooks/useApiError"
import { ApiError } from "@/types/errors"

const logger = createLogger('ChatPage')

interface Message {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export default function ChatPage() {
    const router = useRouter()
    const { handleError } = useApiError()
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
                logger.info('Iniciando sesión de chat');
                // Crear o recuperar sesión
                const sessionData = await api.post<{ token: { access_token: string } }>(
                    '/api/v1/auth/session',
                    undefined
                )
                sessionTokenRef.current = sessionData.token.access_token
                logger.debug('Sesión creada', { token: '***' })

                // Cargar historial
                try {
                    const historyData = await api.get<{ messages: Message[] }>('/api/v1/chatbot/messages')
                    setMessages(historyData.messages || [])
                    logger.debug('Historial cargado', { count: historyData.messages?.length })
                } catch (historyError) {
                    logger.warn('No se pudo cargar el historial', { error: String(historyError) })
                }
            } catch (error) {
                logger.error('Error inicializando chat', error as Error)
                handleError(error, { customMessage: 'No se pudo iniciar el chat' })
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
            logger.debug('Enviando mensaje al chat')
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chatbot/chat/stream`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        messages: [...messages, userMessage].filter(m => m.content.trim() !== "")
                    })
                }
            )

            if (!response.ok) {
                throw new ApiError(
                    `Error en el stream`,
                    response.status,
                    'STREAM_ERROR'
                )
            }

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
                            logger.warn('Error parseando chunk de stream', { chunk: trimmedLine })
                        }
                    }
                }
            }
            logger.debug('Stream completado', { chars: assistantContent.length })
        } catch (error) {
            logger.error('Error en el chat', error as Error)
            handleError(error, { customMessage: 'Error al procesar tu mensaje' })
            // Quitar el mensaje asistente vacío si el stream falló antes de recibir contenido
            setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last?.role === 'assistant' && last.content === '') {
                    return prev.slice(0, -1)
                }
                return [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error al procesar tu solicitud.' }]
            })
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