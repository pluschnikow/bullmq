"use strict";
// Type definitions for bull 3.10
// Project: https://github.com/OptimalBits/bull
// Definitions by: Bruno Grieder <https://github.com/bgrieder>
//                 Cameron Crothers <https://github.com/JProgrammer>
//                 Marshall Cottrell <https://github.com/marshall007>
//                 Weeco <https://github.com/weeco>
//                 Gabriel Terwesten <https://github.com/blaugold>
//                 Oleg Repin <https://github.com/iamolegga>
//                 David Koblas <https://github.com/koblas>
//                 Bond Akinmade <https://github.com/bondz>
//                 Wuha Team <https://github.com/wuha-team>
//                 Alec Brunelle <https://github.com/aleccool213>
//                 Dan Manastireanu <https://github.com/danmana>
//                 Kjell-Morten Bratsberg Thorsen <https://github.com/kjellmorten>
//                 Christian D. <https://github.com/pc-jedi>
//                 Silas Rech <https://github.com/lenovouser>
//                 DoYoung Ha <https://github.com/hados99>
//                 Borys Kupar <https://github.com/borys-kupar>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.8
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const _1 = require("./");
class Queue3 extends events_1.EventEmitter {
    /**
     * This is the Queue constructor.
     * It creates a new Queue that is persisted in Redis.
     * Everytime the same queue is instantiated it tries to process all the old jobs
     * that may exist from a previous unfinished session.
     */
    constructor(name, opts) {
        super();
        this.opts = opts;
        this.name = name;
        this.queue = new _1.Queue(this.name, this.opts);
    }
    /**
     * Returns a promise that resolves when Redis is connected and the queue is ready to accept jobs.
     * This replaces the `ready` event emitted on Queue in previous verisons.
     */
    async isReady() {
        await this.queue.client;
        return this;
    }
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
    async process(processor) {
        if (this.worker) {
            throw new Error('Queue3.process() cannot be called twice');
        }
        this.worker = new _1.Worker(this.name, processor, this.opts);
        this.queueScheduler = new _1.QueueScheduler(this.name, this.opts);
        await this.worker.client;
    }
    add(jobName, data, opts) {
        return this.queue.add(jobName, data, opts);
    }
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
    async pause() {
        return this.queue.pause();
    }
    async pauseWorker(doNotWaitActive) {
        if (!this.worker) {
            throw new Error('Worker is not initialized, call process() first');
        }
        return this.worker.pause(doNotWaitActive);
    }
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
    async resume() {
        return this.queue.resume();
    }
    async resumeWorker() {
        if (!this.worker) {
            throw new Error('Worker is not initialized, call process() first');
        }
        return this.worker.resume();
    }
    isWorkerPaused() {
        return this.worker && this.worker.isPaused();
    }
    /**
     * Returns a promise that returns the number of jobs in the queue, waiting or paused.
     * Since there may be other processes adding or processing jobs,
     * this value may be true only for a very small amount of time.
     */
    count() {
        return this.queue.count();
    }
    /**
     * Empties a queue deleting all the input lists and associated jobs.
     */
    empty() {
        return this.queue.drain();
    }
    /**
     * Closes the underlying redis client. Use this to perform a graceful shutdown.
     *
     * `close` can be called from anywhere, with one caveat:
     * if called from within a job handler the queue won't close until after the job has been processed
     */
    close() {
        const promises = [];
        if (this.queueScheduler) {
            promises.push(this.queueScheduler.close());
        }
        if (this.queue) {
            promises.push(this.queue.close());
        }
        if (this.queueEvents) {
            promises.push(this.queueEvents.close());
        }
        if (this.worker) {
            promises.push(this.worker.close());
        }
        return Promise.all(promises);
    }
    /**
     * Returns a promise that will return the job instance associated with the jobId parameter.
     * If the specified job cannot be located, the promise callback parameter will be set to null.
     */
    getJob(jobId) {
        return this.queue.getJob(jobId);
    }
    /**
     * Returns a promise that will return an array with the waiting jobs between start and end.
     */
    getWaiting(start = 0, end = -1) {
        return this.queue.getWaiting(start, end);
    }
    /**
     * Returns a promise that will return an array with the active jobs between start and end.
     */
    getActive(start = 0, end = -1) {
        return this.queue.getActive(start, end);
    }
    /**
     * Returns a promise that will return an array with the delayed jobs between start and end.
     */
    getDelayed(start = 0, end = -1) {
        return this.queue.getDelayed(start, end);
    }
    /**
     * Returns a promise that will return an array with the completed jobs between start and end.
     */
    getCompleted(start = 0, end = -1) {
        return this.queue.getCompleted(start, end);
    }
    /**
     * Returns a promise that will return an array with the failed jobs between start and end.
     */
    async getFailed(start = 0, end = -1) {
        return this.queue.getFailed(start, end);
    }
    /**
     * Returns JobInformation of repeatable jobs (ordered descending). Provide a start and/or an end
     * index to limit the number of results. Start defaults to 0, end to -1 and asc to false.
     */
    async getRepeatableJobs(start = 0, end = -1, asc = false) {
        const repeat = await this.queue.repeat;
        return repeat.getRepeatableJobs(start, end, asc);
    }
    /**
     * ???
     */
    async nextRepeatableJob(name, data, opts, skipCheckExists) {
        const repeat = await this.queue.repeat;
        return repeat.addNextRepeatableJob(name, data, opts, skipCheckExists);
    }
    /**
     * Removes a given repeatable job. The RepeatOptions and JobId needs to be the same as the ones
     * used for the job when it was added.
     *
     * name: The name of the to be removed job
     */
    async removeRepeatable(name, opts) {
        const repeat = await this.queue.repeat;
        return repeat.removeRepeatable(name, opts, opts.jobId);
    }
    /**
     * Removes a given repeatable job by key.
     */
    async removeRepeatableByKey(repeatJobKey) {
        const repeat = await this.queue.repeat;
        const client = await repeat.client;
        const tokens = repeatJobKey.split(':');
        const data = {
            key: repeatJobKey,
            name: tokens[0],
            id: tokens[1] || null,
            endDate: parseInt(tokens[2]) || null,
            tz: tokens[3] || null,
            cron: tokens[4],
        };
        const queueKey = repeat.toKey('');
        return client.removeRepeatable(repeat.keys.repeat, repeat.keys.delayed, data.id, repeatJobKey, queueKey);
    }
    /**
     * Returns a promise that will return an array of job instances of the given types.
     * Optional parameters for range and ordering are provided.
     */
    getJobs(types, start = 0, end = -1, asc = false) {
        return this.queue.getJobs(types, start, end, asc);
    }
    async getNextJob() {
        throw new Error('Not supported');
    }
    /**
     * Returns a object with the logs according to the start and end arguments. The returned count
     * value is the total amount of logs, useful for implementing pagination.
     */
    getJobLogs(jobId, start = 0, end = -1) {
        return this.queue.getJobLogs(jobId, start, end);
    }
    /**
     * Returns a promise that resolves with the job counts for the given queue.
     */
    getJobCounts(...types) {
        return this.queue.getJobCounts(...types);
    }
    /**
     * Returns a promise that resolves with the job counts for the given queue of the given types.
     */
    async getJobCountByTypes(...types) {
        return this.queue.getJobCountByTypes(...types);
    }
    /**
     * Returns a promise that resolves with the quantity of completed jobs.
     */
    getCompletedCount() {
        return this.queue.getCompletedCount();
    }
    /**
     * Returns a promise that resolves with the quantity of failed jobs.
     */
    getFailedCount() {
        return this.queue.getFailedCount();
    }
    /**
     * Returns a promise that resolves with the quantity of delayed jobs.
     */
    getDelayedCount() {
        return this.queue.getDelayedCount();
    }
    /**
     * Returns a promise that resolves with the quantity of waiting jobs.
     */
    getWaitingCount() {
        return this.queue.getWaitingCount();
    }
    /**
     * Returns a promise that resolves with the quantity of paused jobs.
     */
    getPausedCount() {
        return this.queue.getJobCountByTypes('paused');
    }
    /**
     * Returns a promise that resolves with the quantity of active jobs.
     */
    getActiveCount() {
        return this.queue.getActiveCount();
    }
    /**
     * Returns a promise that resolves to the quantity of repeatable jobs.
     */
    async getRepeatableCount() {
        const repeat = await this.queue.repeat;
        return repeat.getRepeatableCount();
    }
    /**
     * Tells the queue remove all jobs created outside of a grace period in milliseconds.
     * You can clean the jobs with the following states: completed, wait (typo for waiting), active, delayed, and failed.
     * @param grace Grace period in milliseconds.
     * @param limit Maximum amount of jobs to clean per call. If not provided will clean all matching jobs.
     * @param type Status of the job to clean. Values are completed, wait,
     * active, paused, delayed, and failed. Defaults to completed.
     */
    clean(grace, limit, type = 'completed') {
        return this.queue.clean(grace, limit, type);
    }
    on(event, listener) {
        return this.attachListener(false, event, listener);
    }
    once(event, listener) {
        return this.attachListener(true, event, listener);
    }
    off(event, listener) {
        return this.detachListener(event, listener);
    }
    removeListener(event, listener) {
        if (!listener) {
            throw new Error('listener is required');
        }
        return this.detachListener(event, listener);
    }
    removeAllListeners(event) {
        return this.detachListener(event);
    }
    /**
     * Set clientName to Redis.client
     */
    setWorkerName() {
        throw new Error('Not supported');
    }
    /**
     * Returns Redis clients array which belongs to current Queue
     */
    getWorkers() {
        return this.queue.getWorkers();
    }
    /**
     * Returns Queue name in base64 encoded format
     */
    base64Name() {
        return this.queue.base64Name();
    }
    /**
     * Returns Queue name with keyPrefix (default: 'bull')
     */
    clientName() {
        return this.queue.clientName();
    }
    /**
     * Returns Redis clients array which belongs to current Queue from string with all redis clients
     *
     * @param list String with all redis clients
     */
    parseClientList(list) {
        return this.queue.parseClientList(list);
    }
    retryJob(job) {
        return job.retry();
    }
    getQueueEvents() {
        if (!this.queueEvents) {
            this.queueEvents = new _1.QueueEvents(this.name, this.opts);
        }
        return this.queueEvents;
    }
    ensureWorkerCreated() {
        if (!this.worker) {
            throw new Error('You should create internal ' +
                'worker by calling progress() ' +
                'prior to attach listeners to worker events');
        }
    }
    attachListener(once, event, listener) {
        switch (event) {
            case 'active':
                this.ensureWorkerCreated();
                if (once) {
                    this.worker.once('active', listener);
                }
                else {
                    this.worker.on('active', listener);
                }
                break;
            case 'completed':
                this.ensureWorkerCreated();
                if (once) {
                    this.worker.once('completed', listener);
                }
                else {
                    this.worker.on('completed', listener);
                }
                break;
            case 'drained':
                this.ensureWorkerCreated();
                if (once) {
                    this.worker.once('drained', listener);
                }
                else {
                    this.worker.on('drained', listener);
                }
                break;
            case 'failed':
                this.ensureWorkerCreated();
                if (once) {
                    this.worker.once('failed', listener);
                }
                else {
                    this.worker.on('failed', listener);
                }
                break;
            case 'paused':
                if (once) {
                    this.queue.once('paused', listener);
                }
                else {
                    this.queue.on('paused', listener);
                }
                break;
            case 'resumed':
                if (once) {
                    this.queue.once('resumed', listener);
                }
                else {
                    this.queue.on('resumed', listener);
                }
                break;
            case 'progress':
                if (once) {
                    this.queue.once('progress', listener);
                }
                else {
                    this.queue.on('progress', listener);
                }
                break;
            case 'waiting':
                if (once) {
                    this.queue.once('waiting', listener);
                }
                else {
                    this.queue.on('waiting', listener);
                }
                break;
            case 'global:active':
                if (once) {
                    this.getQueueEvents().once('active', listener);
                }
                else {
                    this.getQueueEvents().on('active', listener);
                }
                break;
            case 'global:completed':
                if (once) {
                    this.getQueueEvents().once('completed', listener);
                }
                else {
                    this.getQueueEvents().on('completed', listener);
                }
                break;
            case 'global:drained':
                if (once) {
                    this.getQueueEvents().once('drained', listener);
                }
                else {
                    this.getQueueEvents().on('drained', listener);
                }
                break;
            case 'global:failed':
                if (once) {
                    this.getQueueEvents().once('failed', listener);
                }
                else {
                    this.getQueueEvents().on('failed', listener);
                }
                break;
            case 'global:paused':
                if (once) {
                    this.getQueueEvents().once('paused', listener);
                }
                else {
                    this.getQueueEvents().on('paused', listener);
                }
                break;
            case 'global:resumed':
                if (once) {
                    this.getQueueEvents().once('resumed', listener);
                }
                else {
                    this.getQueueEvents().on('resumed', listener);
                }
                break;
            case 'global:progress':
                if (once) {
                    this.getQueueEvents().once('progress', listener);
                }
                else {
                    this.getQueueEvents().on('progress', listener);
                }
                break;
            case 'global:waiting':
                if (once) {
                    this.getQueueEvents().once('waiting', listener);
                }
                else {
                    this.getQueueEvents().on('waiting', listener);
                }
                break;
            default:
                throw new Error(`Listening on '${String(event)}' event is not supported`);
        }
        return this;
    }
    detachListener(event, listener) {
        switch (event) {
            case 'active':
                if (this.worker) {
                    if (listener) {
                        this.worker.removeListener('active', listener);
                    }
                    else {
                        this.worker.removeAllListeners('active');
                    }
                }
                break;
            case 'completed':
                if (this.worker) {
                    if (listener) {
                        this.worker.removeListener('completed', listener);
                    }
                    else {
                        this.worker.removeAllListeners('completed');
                    }
                }
                break;
            case 'drained':
                if (this.worker) {
                    if (listener) {
                        this.worker.removeListener('drained', listener);
                    }
                    else {
                        this.worker.removeAllListeners('drained');
                    }
                }
                break;
            case 'failed':
                if (this.worker) {
                    if (listener) {
                        this.worker.removeListener('failed', listener);
                    }
                    else {
                        this.worker.removeAllListeners('failed');
                    }
                }
                break;
            case 'paused':
                if (listener) {
                    this.queue.removeListener('paused', listener);
                }
                else {
                    this.queue.removeAllListeners('paused');
                }
                break;
            case 'resumed':
                if (listener) {
                    this.queue.removeListener('resumed', listener);
                }
                else {
                    this.queue.removeAllListeners('resumed');
                }
                break;
            case 'progress':
                if (listener) {
                    this.queue.removeListener('progress', listener);
                }
                else {
                    this.queue.removeAllListeners('progress');
                }
                break;
            case 'waiting':
                if (listener) {
                    this.queue.removeListener('waiting', listener);
                }
                else {
                    this.queue.removeAllListeners('waiting');
                }
                break;
            case 'global:active':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('active', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('active');
                    }
                }
                break;
            case 'global:completed':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('completed', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('completed');
                    }
                }
                break;
            case 'global:drained':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('drained', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('drained');
                    }
                }
                break;
            case 'global:failed':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('failed', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('failed');
                    }
                }
                break;
            case 'global:paused':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('paused', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('paused');
                    }
                }
                break;
            case 'global:resumed':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('resumed', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('resumed');
                    }
                }
                break;
            case 'global:waiting':
                if (this.queueEvents) {
                    if (listener) {
                        this.queueEvents.removeListener('waiting', listener);
                    }
                    else {
                        this.queueEvents.removeAllListeners('waiting');
                    }
                }
                break;
            default:
                break;
        }
        return this;
    }
}
exports.Queue3 = Queue3;
//# sourceMappingURL=compat.js.map