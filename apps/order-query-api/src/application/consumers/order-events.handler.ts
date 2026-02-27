import { ORDER_EVENT_TYPES } from "@/src/application/events/order.events";

export class OrderEventsHandler {
    // constructor(private projection: OrderProjection) {}
    async handle(raw: string): Promise<void> {
        let event: any;
        try {
            event = JSON.parse(raw);
        } catch (err) {
            console.error("Failed to parse event", { raw, error: err });
        }

        this.validateEnvelope(event);
        switch (event.eventType) {
            case ORDER_EVENT_TYPES.ORDER_CREATED:
                // await this.projection.applyOrderCreated(event.payload);
                console.log('Order Created Received');
                break;
            default:
                console.warn("Unknown event type", { eventType: event.eventType });
        }
    }

    private validateEnvelope(envelope: any): asserts envelope is { eventType: string; payload: any } {
        if (typeof envelope !== "object" || envelope === null) {
            throw new Error("Invalid event: not an object");// TODO need to verify more types BUT I DONT WANT TO
        }
    }
}