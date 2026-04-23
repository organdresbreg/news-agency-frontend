// src/types/ws-events.ts

/**
 * Tipos de eventos que emite el backend FastAPI/LangGraph
 */
export type WsEventType =
    | 'STREAM_START'      // Inicio del stream de respuesta
    | 'NODE_START'        // Un nodo del grafo comienza a ejecutarse
    | 'NODE_END'          // Un nodo del grafo termina su ejecución
    | 'TOOL_CALL'         // El agente llama a una herramienta externa (MCP/Tool)
    | 'HITL_PAUSE'        // Pausa crítica: requiere intervención humana
    | 'HITL_RESUME'       // Confirmación de reanudación tras HITL
    | 'STREAM_END'        // Fin del stream de respuesta
    | 'ERROR';            // Error en el procesamiento del agente

/**
 * Estructura base común a todos los eventos WebSocket
 */
export interface BaseWsEvent {
    type: WsEventType;
    threadId: string;     // ID del hilo/conversación actual
    timestamp: number;    // Timestamp Unix del evento
}

/**
 * Evento: Inicio de un nodo del grafo LangGraph
 * Se usa para actualizar el visualizador de React Flow o logs de observabilidad
 */
export interface NodeStartEvent extends BaseWsEvent {
    type: 'NODE_START';
    nodeId: string;       // ID técnico del nodo (ej: "agent_executor")
    nodeName: string;     // Nombre legible (ej: "Investigador de Noticias")
}

/**
 * Evento: Fin de un nodo del grafo LangGraph
 */
export interface NodeEndEvent extends BaseWsEvent {
    type: 'NODE_END';
    nodeId: string;
    nodeName: string;
    durationMs?: number;  // Opcional: tiempo que tardó el nodo
}

/**
 * Evento: Llamada a una Herramienta o MCP
 * Muestra qué recurso externo está consultando el agente en vivo
 */
export interface ToolCallEvent extends BaseWsEvent {
    type: 'TOOL_CALL';
    toolName: string;     // Ej: "search_news_api", "read_mcp_resource"
    args: any;            // Argumentos enviados a la herramienta
    status: 'pending' | 'completed' | 'failed';
    result?: any;         // Resultado (si status es completed)
}

/**
 * Evento: PAUSA HITL (Human-in-the-Loop)
 * CRÍTICO: Bloquea la UI hasta que el usuario responde
 */
export interface HitlPauseEvent extends BaseWsEvent {
    type: 'HITL_PAUSE';
    question: string;     // La pregunta que el agente hace al humano
    options?: string[];   // Opciones predefinidas si es elección múltiple
    context: any;         // Contexto adicional para ayudar al humano a decidir
    requiresApproval: boolean; // Si requiere un botón de "Aprobar/Rechazar" explícito
}

/**
 * Evento: Reanudación tras HITL
 * Confirma que el humano ya respondió y el grafo continúa
 */
export interface HitlResumeEvent extends BaseWsEvent {
    type: 'HITL_RESUME';
    response: any;        // La respuesta dada por el humano
}

/**
 * Evento: Chunk de Stream (Texto generado)
 * Para renderizar la respuesta del agente en tiempo real (efecto máquina de escribir)
 */
export interface StreamChunkEvent extends BaseWsEvent {
    type: 'STREAM_START' | 'STREAM_END';
    content?: string;     // El fragmento de texto generado (puede ser vacío en START/END)
    isComplete: boolean;  // True si es STREAM_END
}

/**
 * Evento: Error
 */
export interface ErrorEvent extends BaseWsEvent {
    type: 'ERROR';
    message: string;
    code?: string;
}

/**
 * Unión de todos los eventos posibles para el handler de WebSocket
 * Esto permite usar switch(event.type) con tipado exhaustivo en TypeScript
 */
export type WsEvent =
    | BaseWsEvent
    | NodeStartEvent
    | NodeEndEvent
    | ToolCallEvent
    | HitlPauseEvent
    | HitlResumeEvent
    | StreamChunkEvent
    | ErrorEvent;