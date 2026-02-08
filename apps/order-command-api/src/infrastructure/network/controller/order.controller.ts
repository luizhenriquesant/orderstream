import type { FastifyReply, FastifyRequest } from 'fastify';

import { CreateOrderUseCase } from "@application/usecases/create-order.usecase";
import { CreateOrderDto } from '@application/dtos/order.dto';
import { getOrCreateCorrelationId } from '@utils/correlation-id.utils';

export class FastifyOrderController {
    public constructor(
        private readonly createOrderUseCase: CreateOrderUseCase
    ) { }
    public async create(
        request: FastifyRequest,
        reply: FastifyReply,
    ): Promise<void> {
        const body = request.body as CreateOrderDto;
        const correlationId = getOrCreateCorrelationId(request.headers['correlation-id'] as string | undefined);

        const result = await this.createOrderUseCase.execute(body, correlationId);

        reply.header('correlation-id', correlationId);
        reply.status(201).send(result);
    }
}