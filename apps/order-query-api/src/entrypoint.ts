import Fastify from 'fastify'

async function main() {
    const fastify = Fastify({
        logger: true
    })

    fastify.get('/health', {
        schema: {
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        time: { type: 'string' }
                    },
                }
            }
        }
    }, () => {
        return {
            status: 'ok',
            time: new Date().toISOString()
        }
    })

    let isShuttingDown = false;
    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        try {
            fastify.log.info({ signal }, 'Shutting down...');

            await fastify.close();

            fastify.log.info('Shutdown complete');

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
        port: 3001,
        host: '0.0.0.0',
    });
}

main().catch((err) => {
    console.error('Error starting server:', err)
    process.exit(1)
});
