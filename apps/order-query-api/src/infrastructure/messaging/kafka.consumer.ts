import type { Consumer } from "kafkajs";
import type {
    ConsumerRepository,
    ConsumeHandler,
    ConsumeMessage,
    ConsumerRunOptions,
} from "@/src/domain/repositories/consumer.repository";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(baseMs: number, attempt: number): number {
    return baseMs * Math.pow(2, attempt);
}

type KafkaHeaderValue = string | Buffer | Array<string | Buffer> | undefined;
type KafkaHeaders = Record<string, KafkaHeaderValue> | undefined;

function normalizeHeaders(headers: KafkaHeaders): Record<string, string> {
    const out: Record<string, string> = {};
    if (!headers) return out;

    for (const [k, v] of Object.entries(headers)) {
        if (v === undefined) continue;

        const first = Array.isArray(v) ? v[0] : v;
        if (first === undefined) continue;

        out[k] = Buffer.isBuffer(first) ? first.toString("utf-8") : String(first);
    }

    return out;
}

export class KafkaConsumerRepository implements ConsumerRepository {
    public constructor(private readonly consumer: Consumer) { }

    async connect(): Promise<void> {
        await this.consumer.connect();
    }

    async subscribe(topic: string, opts?: { fromBeginning?: boolean }): Promise<void> {
        await this.consumer.subscribe({
            topic,
            fromBeginning: opts?.fromBeginning ?? false,
        });
    }

    async run(handler: ConsumeHandler, opts?: ConsumerRunOptions): Promise<void> {
        const maxRetries =
            opts?.maxRetries ?? Number(process.env.KAFKA_MAX_RETRIES ?? 5);
        const baseDelayMs =
            opts?.baseDelayMs ?? Number(process.env.KAFKA_RETRY_BASE_DELAY_MS ?? 200);

        const dlq = opts?.dlq;

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) return;

                const value = message.value.toString("utf-8");
                const key = message.key ? message.key.toString("utf-8") : undefined;
                const headers = normalizeHeaders(message.headers);

                const msg: ConsumeMessage = {
                    topic,
                    partition,
                    offset: message.offset,
                    key,
                    value,
                    headers,
                };

                let attempt = 0;

                while (true) {
                    try {
                        await handler(msg);
                        return; // sucesso -> segue e comita
                    } catch (err: any) {
                        const isLastAttempt = attempt >= maxRetries;

                        if (isLastAttempt) {
                            // Se não tiver DLQ configurado, rethrow (comportamento “barulhento” em dev)
                            if (!dlq) {
                                console.error("[KafkaConsumer] handler failed (no DLQ configured)", {
                                    topic,
                                    partition,
                                    offset: msg.offset,
                                    attempt: attempt + 1,
                                    error: err?.message ?? String(err),
                                });
                                throw err;
                            }

                            const dlqPayload = {
                                original: msg,
                                failure: {
                                    errorMessage: err?.message ?? String(err),
                                    errorStack: err?.stack,
                                    failedAtIso: new Date().toISOString(),
                                    attempts: attempt + 1,
                                },
                            };

                            const dlqKey = msg.key ?? `${msg.topic}:${msg.partition}:${msg.offset}`;
                            await dlq.producer.publish(dlq.topic, dlqKey, JSON.stringify(dlqPayload));

                            // IMPORTANTE: não rethrow para não ficar preso no mesmo offset
                            return;
                        }

                        const delay = backoffDelay(baseDelayMs, attempt);

                        console.error("[KafkaConsumer] handler failed, retrying...", {
                            topic,
                            partition,
                            offset: msg.offset,
                            attempt: attempt + 1,
                            nextDelayMs: delay,
                            error: err?.message ?? String(err),
                        });

                        await sleep(delay);
                        attempt += 1;
                    }
                }
            },
        });
    }

    async disconnect(): Promise<void> {
        await this.consumer.disconnect();
    }
}