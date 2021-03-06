import { Job } from '../classes';
import { AdvancedOptions, QueueBaseOptions, RateLimiterOptions } from './';
export declare type Processor = (job: Job) => Promise<any>;
export interface WorkerOptions extends QueueBaseOptions {
    concurrency?: number;
    limiter?: RateLimiterOptions;
    skipDelayCheck?: boolean;
    drainDelay?: number;
    lockDuration?: number;
    lockRenewTime?: number;
    visibilityWindow?: number;
    settings?: AdvancedOptions;
}
