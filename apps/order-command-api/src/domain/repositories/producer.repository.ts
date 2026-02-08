
export type ProducerRepository = {
    connect(): Promise<void>;
    publish(
        topic: string,
        key: string,
        value: string
    ): Promise<void>;
    disconnect(): Promise<void>;
}