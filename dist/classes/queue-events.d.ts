import { QueueEventsOptions } from '../interfaces';
import { QueueBase } from './queue-base';
export declare class QueueEvents extends QueueBase {
    consuming: Promise<void>;
    constructor(name: string, opts?: QueueEventsOptions);
    private consumeEvents;
    close(): Promise<void>;
}
