// src/application/events/orders.events.ts
import { randomUUID } from "crypto";

/**
 * 1) Event Types (strings de contrato)
 */
export const ORDER_EVENT_TYPES = {
    ORDER_CREATED: "OrderCreated",
} as const;

export type OrderEventType =
    (typeof ORDER_EVENT_TYPES)[keyof typeof ORDER_EVENT_TYPES];

/**
 * 2) Payloads (contratos do que vai dentro do payload)
 */
export type OrderItemPayload = {
    sku: string;
    quantity: number;
    unitPrice: string; // decimal como string: "12.34"
};

export type OrderCreatedPayload = {
    orderId: string;
    customerId?: string;
    currency: string; // ex: "BRL"
    items: OrderItemPayload[];
};

/**
 * 3) Envelope genérico
 */
export type EventEnvelope<TEventType extends string, TPayload> = {
    eventId: string;
    eventType: TEventType;

    aggregateId: string; // orderId
    occurredAt: string;  // ISO string
    correlationId: string;

    payload: TPayload;
};

/**
 * 4) Helper para criar envelope (Etapa 2)
 * - Gera eventId
 * - Gera occurredAt
 * - Padroniza o formato do evento
 */
export function createEnvelope<TEventType extends string, TPayload>(input: {
    eventType: TEventType;
    aggregateId: string;
    correlationId: string;
    payload: TPayload;
    eventId?: string;
    occurredAt?: string;
}): EventEnvelope<TEventType, TPayload> {
    return {
        eventId: input.eventId ?? randomUUID(),
        eventType: input.eventType,

        aggregateId: input.aggregateId,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        correlationId: input.correlationId,

        payload: input.payload,
    };
}

/**
 * 5) Tipos “prontos” para o evento OrderCreated (opcional, mas útil)
 */
export type OrderCreatedEvent = EventEnvelope<
    typeof ORDER_EVENT_TYPES.ORDER_CREATED,
    OrderCreatedPayload
>;
