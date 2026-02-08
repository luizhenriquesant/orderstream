import { CreateOrderDto, CreateOrderSuccessResponse } from '@application/dtos/order.dto';
import { randomUUID } from "crypto";
export class CreateOrderUseCase {
    constructor() {
    }

    async execute(dto: CreateOrderDto, correlationId: string): Promise<CreateOrderSuccessResponse> {
        return { orderId: randomUUID() };
    }
}