import { JobsOptions } from '../interfaces';
import IORedis from 'ioredis';
import { ConnectionOptions } from './redis-options';
export declare enum ClientType {
    blocking = "blocking",
    normal = "normal"
}
export interface QueueBaseOptions {
    connection?: ConnectionOptions;
    client?: IORedis.Redis;
    prefix?: string;
}
export interface QueueOptions extends QueueBaseOptions {
    defaultJobOptions?: JobsOptions;
    streams?: {
        events: {
            maxLen: number;
        };
    };
}
export interface QueueEventsOptions extends QueueBaseOptions {
    lastEventId?: string;
    blockingTimeout?: number;
}
