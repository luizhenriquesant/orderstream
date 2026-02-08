
import { FastifyInstance } from 'fastify';
import { CreateOrderDtoSchema, CreateOrderSuccessReponseSchema } from '@application/dtos/order.dto';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { FastifyOrderController } from '@infrastructure/network/controller/order.controller';

export const fastifyOrderRoutes = (
    fastify: FastifyInstance,
    controller: FastifyOrderController
) => {
    fastify.withTypeProvider<ZodTypeProvider>().post('/orders', {
        schema: {
            tags: ['Orders'],
            body: CreateOrderDtoSchema,
            response: {
                201: CreateOrderSuccessReponseSchema
            }
        }
    }, controller.create.bind(controller));
};