import Fastify from "fastify";
import { Kafka } from "kafkajs";

import { KafkaConsumerRepository } from "./infrastructure/messaging/kafka.consumer";
import { OrderEventsHandler } from "./application/consumers/order-events.handler";
import { KafkaProducer } from "./infrastructure/messaging/kafka.producer";

async function main() {
    const fastify = Fastify({ logger: true });

    fastify.get(
        "/health",
        {
            schema: {
                tags: ["Health"],
                response: {
                    200: {
                        type: "object",
                        properties: {
                            status: { type: "string" },
                            time: { type: "string" },
                        },
                    },
                },
            },
        },
        async () => {
            return { status: "ok", time: new Date().toISOString() };
        }
    );

    const brokersEnv = process.env.KAFKA_BROKERS ?? "kafka:9092";
    const brokers = brokersEnv
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean);

    if (brokers.length === 0) {
        throw new Error("KAFKA_BROKERS is empty or invalid");
    }

    const clientId = process.env.KAFKA_QUERY_CLIENT_ID ?? "order-query-api";
    const groupId =
        process.env.KAFKA_GROUP_ID ??
        process.env.KAFKA_QUERY_GROUP_ID ??
        "order-query-consumer";

    const topic = process.env.KAFKA_TOPIC_EVENTS ?? "orders.events";
    const dlqTopic = process.env.KAFKA_TOPIC_EVENTS_DLQ ?? `${topic}.dlq`;

    const maxRetries = Number(process.env.KAFKA_MAX_RETRIES ?? 5);
    const baseDelayMs = Number(process.env.KAFKA_RETRY_BASE_DELAY_MS ?? 200);

    const fromBeginning = (process.env.KAFKA_FROM_BEGINNING ?? "false") === "true";

    const kafka = new Kafka({ clientId, brokers });

    const rawConsumer = kafka.consumer({ groupId });
    const consumerRepo = new KafkaConsumerRepository(rawConsumer);

    const rawProducer = kafka.producer();
    const dlqProducer = new KafkaProducer(rawProducer);

    const handler = new OrderEventsHandler();

    await consumerRepo.connect();
    await dlqProducer.connect();

    await consumerRepo.subscribe(topic, { fromBeginning });

    consumerRepo
        .run(
            async (msg) => {
                await handler.handle(msg.value);
            },
            {
                maxRetries,
                baseDelayMs,
                dlq: {
                    topic: dlqTopic,
                    producer: dlqProducer,
                },
            }
        )
        .catch((err) => {
            fastify.log.error({ err }, "Kafka consumer crashed");
            process.exit(1);
        });

    let isShuttingDown = false;

    const shutdown = async (signal: string) => {
        if (isShuttingDown) return;
        isShuttingDown = true;

        fastify.log.info({ signal }, "Shutting down...");

        try {
            await fastify.close();
        } catch (err) {
            fastify.log.error({ err }, "Error closing Fastify");
        }
        try {
            await consumerRepo.disconnect();
        } catch (err) {
            fastify.log.error({ err }, "Error disconnecting Kafka consumer");
        }

        try {
            await dlqProducer.disconnect();
        } catch (err) {
            fastify.log.error({ err }, "Error disconnecting Kafka producer");
        }

        fastify.log.info("Shutdown complete");
        process.exit(0);
    };

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));

    await fastify.ready();

    await fastify.listen({
        port: 3001,
        host: "0.0.0.0",
    });
}

main().catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
});