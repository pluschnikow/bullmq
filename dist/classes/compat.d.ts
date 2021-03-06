/// <reference types="node" />
import { EventEmitter } from 'events';
import { Job } from './';
import { JobsOptions, QueueOptions, RepeatOptions, QueueEventsOptions, QueueSchedulerOptions, WorkerOptions, Processor } from '../interfaces';
declare type CommonOptions = QueueSchedulerOptions & QueueOptions & WorkerOptions & QueueEventsOptions;
export declare class Queue3<T = any> extends EventEmitter {
    /**
     * The name of the queue
     */
    name: string;
    private opts;
    private readonly queue;
    private queueEvents;
    private worker;
    private queueScheduler;
    /**
     * This is the Queue constructor.
     * It creates a new Queue that is persisted in Redis.
     * Everytime the same queue is instantiated it tries to process all the old jobs
     * that may exist from a previous unfinished session.
     */
    constructor(name: string, opts?: CommonOptions);
    /**
     * Returns a promise that resolves when Redis is connected and the queue is ready to accept jobs.
     * This replaces the `ready` event emitted on Queue in previous verisons.
     */
    isReady(): Promise<this>;
    /**
     * Defines a processing function for the jobs placed into a given Queue.
     *
     * The callback is called everytime a job is placed in the queue.
     * It is passed an instance of the job as first argument.
     *
     * If the callback signature contains the second optional done argument,
     * the callback will be passed a done callback to be called after the job has been completed.
     * The done callback can be called with an Error instance, to signal that the job did not complete successfully,
     * or with a result as second argument (e.g.: done(null, result);) when the job is successful.
     * Errors will be passed as a second argument to the "failed" event; results,
     * as a second argument to the "completed" event.
     *
     * If, however, the callback signature does not contain the done argument,
     * a promise must be returned to signal job completion.
     * If the promise is rejected, the error will be passed as a second argument to the "failed" event.
     * If it is resolved, its value will be the "completed" event's second argument.
     */
    process(processor: string | Processor): Promise<void>;
    add(jobName: string, data: any, opts?: JobsOptions): Promise<Job>;
    /**
     * Returns a promise that resolves when the queue is paused.
     *
     * A paused queue will not process new jobs until resumed, but current jobs being processed will continue until
     * they are finalized. The pause can be either global or local. If global, all workers in all queue instances
     * for a given queue will be paused. If local, just this worker will stop processing new jobs after the current
     * lock expires. This can be useful to stop a worker from taking new jobs prior to shutting down.
     *
     * Pausing a queue that is already paused does nothing.
     */
    pause(): Promise<void>;
    pauseWorker(doNotWaitActive?: boolean): Promise<void>;
    /**
     * Returns a promise that resolves when the queue is resumed after being paused.
     *
     * The resume can be either local or global. If global, all workers in all queue instances for a given queue
     * will be resumed. If local, only this worker will be resumed. Note that resuming a queue globally will not
     * resume workers that have been paused locally; for those, resume(true) must be called directly on their
     * instances.
     *
     * Resuming a queue that is not paused does nothing.
     */
    resume(): Promise<void>;
    resumeWorker(): Promise<void>;
    isWorkerPaused(): boolean;
    /**
     * Returns a promise that returns the number of jobs in the queue, waiting or paused.
     * Since there may be other processes adding or processing jobs,
     * this value may be true only for a very small amount of time.
     */
    count(): Promise<number>;
    /**
     * Empties a queue deleting all the input lists and associated jobs.
     */
    empty(): Promise<void>;
    /**
     * Closes the underlying redis client. Use this to perform a graceful shutdown.
     *
     * `close` can be called from anywhere, with one caveat:
     * if called from within a job handler the queue won't close until after the job has been processed
     */
    close(): Promise<any>;
    /**
     * Returns a promise that will return the job instance associated with the jobId parameter.
     * If the specified job cannot be located, the promise callback parameter will be set to null.
     */
    getJob(jobId: string): Promise<Job | null>;
    /**
     * Returns a promise that will return an array with the waiting jobs between start and end.
     */
    getWaiting(start?: number, end?: number): Promise<Array<Job>>;
    /**
     * Returns a promise that will return an array with the active jobs between start and end.
     */
    getActive(start?: number, end?: number): Promise<Array<Job>>;
    /**
     * Returns a promise that will return an array with the delayed jobs between start and end.
     */
    getDelayed(start?: number, end?: number): Promise<Array<Job>>;
    /**
     * Returns a promise that will return an array with the completed jobs between start and end.
     */
    getCompleted(start?: number, end?: number): Promise<Array<Job>>;
    /**
     * Returns a promise that will return an array with the failed jobs between start and end.
     */
    getFailed(start?: number, end?: number): Promise<Array<Job>>;
    /**
     * Returns JobInformation of repeatable jobs (ordered descending). Provide a start and/or an end
     * index to limit the number of results. Start defaults to 0, end to -1 and asc to false.
     */
    getRepeatableJobs(start?: number, end?: number, asc?: boolean): Promise<JobInformation3[]>;
    /**
     * ???
     */
    nextRepeatableJob(name: string, data: any, opts?: JobsOptions, skipCheckExists?: boolean): Promise<Job>;
    /**
     * Removes a given repeatable job. The RepeatOptions and JobId needs to be the same as the ones
     * used for the job when it was added.
     *
     * name: The name of the to be removed job
     */
    removeRepeatable(name: string, opts: RepeatOptions): Promise<void>;
    /**
     * Removes a given repeatable job by key.
     */
    removeRepeatableByKey(repeatJobKey: string): Promise<void>;
    /**
     * Returns a promise that will return an array of job instances of the given types.
     * Optional parameters for range and ordering are provided.
     */
    getJobs(types: string[] | string, start?: number, end?: number, asc?: boolean): Promise<Array<Job>>;
    getNextJob(): Promise<Job>;
    /**
     * Returns a object with the logs according to the start and end arguments. The returned count
     * value is the total amount of logs, useful for implementing pagination.
     */
    getJobLogs(jobId: string, start?: number, end?: number): Promise<{
        logs: string[];
        count: number;
    }>;
    /**
     * Returns a promise that resolves with the job counts for the given queue.
     */
    getJobCounts(...types: string[]): Promise<{
        [index: string]: number;
    }>;
    /**
     * Returns a promise that resolves with the job counts for the given queue of the given types.
     */
    getJobCountByTypes(...types: string[]): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of completed jobs.
     */
    getCompletedCount(): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of failed jobs.
     */
    getFailedCount(): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of delayed jobs.
     */
    getDelayedCount(): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of waiting jobs.
     */
    getWaitingCount(): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of paused jobs.
     */
    getPausedCount(): Promise<number>;
    /**
     * Returns a promise that resolves with the quantity of active jobs.
     */
    getActiveCount(): Promise<number>;
    /**
     * Returns a promise that resolves to the quantity of repeatable jobs.
     */
    getRepeatableCount(): Promise<number>;
    /**
     * Tells the queue remove all jobs created outside of a grace period in milliseconds.
     * You can clean the jobs with the following states: completed, wait (typo for waiting), active, delayed, and failed.
     * @param grace Grace period in milliseconds.
     * @param limit Maximum amount of jobs to clean per call. If not provided will clean all matching jobs.
     * @param type Status of the job to clean. Values are completed, wait,
     * active, paused, delayed, and failed. Defaults to completed.
     */
    clean(grace: number, limit: number, type?: 'completed' | 'wait' | 'active' | 'paused' | 'delayed' | 'failed'): Promise<Array<Job>>;
    /**
     * Listens to queue events
     */
    on(event: string, callback: (...args: any[]) => void): this;
    /**
     * An error occured
     */
    on(event: 'error', callback: ErrorEventCallback3): this;
    /**
     * A Job is waiting to be processed as soon as a worker is idling.
     */
    on(event: 'waiting', callback: WaitingEventCallback3): this;
    /**
     * A job has started. You can use `jobPromise.cancel()` to abort it
     */
    on(event: 'active', callback: ActiveEventCallback3<T>): this;
    /**
     * A job has been marked as stalled.
     * This is useful for debugging job workers that crash or pause the event loop.
     */
    on(event: 'stalled', callback: StalledEventCallback3<T>): this;
    /**
     * A job's progress was updated
     */
    on(event: 'progress', callback: ProgressEventCallback3<T>): this;
    /**
     * A job successfully completed with a `result`
     */
    on(event: 'completed', callback: CompletedEventCallback3<T>): this;
    /**
     * A job failed with `err` as the reason
     */
    on(event: 'failed', callback: FailedEventCallback3<T>): this;
    /**
     * The queue has been paused
     */
    on(event: 'paused', callback: EventCallback3): this;
    /**
     * The queue has been resumed
     */
    on(event: 'resumed', callback: EventCallback3): this;
    /**
     * A job successfully removed.
     */
    on(event: 'removed', callback: RemovedEventCallback3<T>): this;
    /**
     * Old jobs have been cleaned from the queue.
     * `jobs` is an array of jobs that were removed, and `type` is the type of those jobs.
     *
     * @see Queue#clean() for details
     */
    on(event: 'cleaned', callback: CleanedEventCallback3<T>): this;
    /**
     * Emitted every time the queue has processed all the waiting jobs
     * (even if there can be some delayed jobs not yet processed)
     */
    on(event: 'drained', callback: EventCallback3): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event: string | symbol): this;
    /**
     * Set clientName to Redis.client
     */
    setWorkerName(): Promise<any>;
    /**
     * Returns Redis clients array which belongs to current Queue
     */
    getWorkers(): Promise<{
        [key: string]: string;
    }[]>;
    /**
     * Returns Queue name in base64 encoded format
     */
    base64Name(): string;
    /**
     * Returns Queue name with keyPrefix (default: 'bull')
     */
    clientName(): string;
    /**
     * Returns Redis clients array which belongs to current Queue from string with all redis clients
     *
     * @param list String with all redis clients
     */
    parseClientList(list: string): {
        [key: string]: string;
    }[];
    retryJob(job: Job): Promise<void>;
    private getQueueEvents;
    private ensureWorkerCreated;
    private attachListener;
    detachListener(event: string | symbol, listener?: (...args: any[]) => void): this;
}
export declare type JobStatusClean3 = 'completed' | 'wait' | 'active' | 'delayed' | 'paused' | 'failed';
export interface JobInformation3 {
    key: string;
    name: string;
    id?: string;
    endDate?: number;
    tz?: string;
    cron: string;
    next: number;
}
export declare type EventCallback3 = () => void;
export declare type ErrorEventCallback3 = (error: Error) => void;
export interface JobPromise3 {
    /**
     * Abort this job
     */
    cancel(): void;
}
export declare type ActiveEventCallback3<T = any> = (job: Job, jobPromise?: JobPromise3) => void;
export declare type StalledEventCallback3<T = any> = (job: Job) => void;
export declare type ProgressEventCallback3<T = any> = (job: Job, progress: any) => void;
export declare type CompletedEventCallback3<T = any> = (job: Job, result: any) => void;
export declare type FailedEventCallback3<T = any> = (job: Job, error: Error) => void;
export declare type CleanedEventCallback3<T = any> = (jobs: Array<Job>, status: JobStatusClean3) => void;
export declare type RemovedEventCallback3<T = any> = (job: Job) => void;
export declare type WaitingEventCallback3 = (jobId: string) => void;
export {};
