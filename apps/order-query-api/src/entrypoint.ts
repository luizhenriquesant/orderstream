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
