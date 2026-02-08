import { ProducerRepository } from '@/src/domain/repositories/producer.repository';
import { Producer } from 'kafkajs';

export class KafkaProducer implements ProducerRepository {
    public constructor(
        private readonly producer: Producer
    ) { }
    async connect(): Promise<void> {
        await this.producer.connect();
    };

    async publish(
        topic: string,
        key: string,
        value: string
    ): Promise<void> {
        const messages = [{ key: key, value: value }]
        await this.producer.send({
            topic,
            messages
        })
    }

    async disconnect(): Promise<void> {
        await this.producer.disconnect();
    }
}