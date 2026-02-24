export type ConsumeMessage = {
    topic: string;
    partition: number;
    offset: string;

    key?: string;
    value: string;
    headers: Record<string, string>;
};

export type ConsumeHandler = (msg: ConsumeMessage) => Promise<void>;

export type ConsumerRunOptions = {
    maxRetries?: number;
    baseDelayMs?: number;

    dlq?: {
        topic: string;
        producer: {
            publish: (topic: string, key: string, value: string) => Promise<void>;
        };
    };
};

export interface ConsumerRepository {
    connect(): Promise<void>;
    subscribe(topic: string, opts?: { fromBeginning?: boolean }): Promise<void>;
    run(handler: ConsumeHandler, opts?: ConsumerRunOptions): Promise<void>;
    disconnect(): Promise<void>;
}