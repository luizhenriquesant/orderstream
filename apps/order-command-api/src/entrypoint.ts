import Fastify from 'fastify'

import FastifyTypeProviderZod from 'fastify-type-provider-zod';
import Zod from 'zod/v4';

import { FastifyOrderController } from '@infrastructure/network/controller/order.controller';
import { fastifyOrderRoutes } from '@infrastructure/network/routes/order.routes';
import { CreateOrderUseCase } from '@application/usecases/create-order.usecase';

async function main() {
    const fastify = Fastify({
        logger: true
    });

    fastify.setValidatorCompiler(FastifyTypeProviderZod.validatorCompiler);
    fastify.setSerializerCompiler(FastifyTypeProviderZod.serializerCompiler);

    fastify.get('/health', {
        schema: {
            tags: ['Health'],
            response: {
                200: Zod.object({
                    status: Zod.string().default('ok'),
                    time: Zod.iso.datetime()
                })
            }
        }
    }, () => {
        return {
            status: 'ok',
            time: new Date().toISOString()
        }
    })

    fastifyOrderRoutes(fastify, new FastifyOrderController(new CreateOrderUseCase()));

    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

main().catch((err) => {
    console.error('Error starting server:', err)
    process.exit(1)
});
