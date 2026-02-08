import { ProducerRepository } from '@/src/domain/repositories/producer.repository';
import { CreateOrderDto, CreateOrderSuccessResponse } from '@application/dtos/order.dto';
import { randomUUID } from "crypto";

import { ORDER_EVENT_TYPES, createEnvelope } from '@application/events/orders.event';

export class CreateOrderUseCase {
    constructor(
        private readonly producer: ProducerRepository
    ) {
    }

    async execute(dto: CreateOrderDto, correlationId: string): Promise<CreateOrderSuccessResponse> {
        const orderId = randomUUID();
        const payload = {
            orderId: randomUUID(),
            customerId: dto.customerId,
            currency: dto.currency,
            items: dto.items
        }

        const envelope = createEnvelope({
            eventType: ORDER_EVENT_TYPES.ORDER_CREATED,
            aggregateId: orderId,
            correlationId,
            payload
        });

        await this.producer.publish(
            process.env.KAFKA_TOPIC_EVENTS ?? "orderId.events",
            orderId,
            JSON.stringify(envelope)
        );

        return { orderId };
    }
}