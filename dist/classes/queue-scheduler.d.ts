import { QueueSchedulerOptions } from '../interfaces';
import { QueueBase } from './';
/**
 * This class is just used for some automatic bookkeeping of the queue,
 * such as updating the delay set as well as moving stalled jobs back
 * to the waiting list.
 *
 * Jobs are checked for stallness once every "visibility window" seconds.
 * Jobs are then marked as candidates for being stalled, in the next check,
 * the candidates are marked as stalled and moved to wait.
 * Workers need to clean the candidate list with the jobs that they are working
 * on, failing to update the list results in the job ending being stalled.
 *
 * This class requires a dedicated redis connection, and at least one is needed
 * to be running at a given time, otherwise delays, stalled jobs, retries, repeatable
 * jobs, etc, will not work correctly or at all.
 *
 */
export declare class QueueScheduler extends QueueBase {
    protected name: string;
    private nextTimestamp;
    private isBlocked;
    constructor(name: string, opts?: QueueSchedulerOptions);
    private run;
    private readDelayedData;
    private updateDelaySet;
    private moveStalledJobsToWait;
    close(): Promise<void>;
}
