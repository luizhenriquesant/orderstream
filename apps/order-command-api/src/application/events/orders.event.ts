import { randomUUID } from "crypto";

export const ORDER_EVENT_TYPES = {
    ORDER_CREATED: "ORDER_CREATED",
} as const;

export type OrderEventType =
    (typeof ORDER_EVENT_TYPES)[keyof typeof ORDER_EVENT_TYPES];

export type OrderItemPayload = {
    sku: string;
    quantity: number;
    unitPrice: string; // decimal como string: "12.34"
};

export type OrderCreatedPayload = {
    orderId: string;
    customerId?: string;
    currency: string;
    items: OrderItemPayload[];
};

export type EventEnvelope<TEventType extends string, TPayload> = {
    eventId: string;
    eventType: TEventType;

    aggregateId: string; // orderId
    occurredAt: string;  // ISO string
    correlationId: string;

    payload: TPayload;
};

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

export type OrderCreatedEvent = EventEnvelope<
    typeof ORDER_EVENT_TYPES.ORDER_CREATED,
    OrderCreatedPayload
>;
