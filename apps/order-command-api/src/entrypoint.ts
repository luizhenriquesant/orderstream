import Fastify from 'fastify'

import FastifyTypeProviderZod from 'fastify-type-provider-zod';
import Zod from 'zod/v4';

import { Kafka } from 'kafkajs';

import { FastifyOrderController } from '@infrastructure/network/controller/order.controller';
import { fastifyOrderRoutes } from '@infrastructure/network/routes/order.routes';
import { CreateOrderUseCase } from '@application/usecases/create-order.usecase';
import { KafkaProducer } from './infrastructure/messaging/kafka.producer';

async function main() {
    const brokers = process.env['KAFKA_BROKERS'];
    if (!brokers) throw new Error();

    const brokersArray = brokers.split(',');
    const kafka = new Kafka({
        clientId: process.env['KAFKA_CLIENT_ID'],
        brokers: brokersArray
    });

    const producer = kafka.producer();
    const kafkaProducerInstance = new KafkaProducer(producer);
    await kafkaProducerInstance.connect();

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

    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        try {
            fastify.log.info({ signal }, 'Shutting down...');

            await fastify.close();

            fastify.log.info('Shutdown complete');

            await kafkaProducerInstance.disconnect();
            process.exit(0);
        } catch (err) {
            console.error('Shutdown failed:', err);
            process.exit(1);
        }
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));

    await fastify.ready();

    await fastify.listen({
        port: 3000,
        host: '0.0.0.0',
    });
}

main().catch((err) => {
    console.error('Error starting server:', err)
    process.exit(1)
});
