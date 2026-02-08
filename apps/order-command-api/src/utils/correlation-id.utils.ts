import { randomUUID } from 'crypto';

export function getOrCreateCorrelationId(input?: string | string[]): string {
    if (!input) return randomUUID();

    const value = Array.isArray(input) ? input[0] : input;

    if (!value || !value.trim()) {
        return randomUUID();
    }

    return value.trim();
}
