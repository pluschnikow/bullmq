"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const classes_1 = require("@src/classes");
const queue_events_1 = require("@src/classes/queue-events");
const worker_1 = require("@src/classes/worker");
const chai_1 = require("chai");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const mocha_1 = require("mocha");
const uuid_1 = require("uuid");
mocha_1.describe('events', function () {
    this.timeout(4000);
    let queue;
    let queueEvents;
    let queueName;
    let client;
    mocha_1.beforeEach(function () {
        client = new ioredis_1.default();
        return client.flushdb();
    });
    mocha_1.beforeEach(async function () {
        queueName = 'test-' + uuid_1.v4();
        queue = new classes_1.Queue(queueName);
        queueEvents = new queue_events_1.QueueEvents(queueName);
        return queueEvents.waitUntilReady();
    });
    afterEach(async function () {
        await queue.close();
        await queueEvents.close();
        return client.quit();
    });
    mocha_1.it('should emit waiting when a job has been added', async function () {
        const waiting = new Promise(resolve => {
            queue.on('waiting', resolve);
        });
        await queue.add('test', { foo: 'bar' });
        await waiting;
    });
    mocha_1.it('should emit global waiting event when a job has been added', async function () {
        const waiting = new Promise(resolve => {
            queue.on('waiting', resolve);
        });
        await queue.add('test', { foo: 'bar' });
        await waiting;
    });
    mocha_1.it('emits drained global drained event when all jobs have been processed', async function () {
        const worker = new worker_1.Worker(queueName, async (job) => { }, {
            drainDelay: 1,
        });
        const drained = new Promise(resolve => {
            queueEvents.once('drained', resolve);
        });
        await queue.add('test', { foo: 'bar' });
        await queue.add('test', { foo: 'baz' });
        await drained;
        const jobs = await queue.getJobCountByTypes('completed');
        chai_1.expect(jobs).to.be.equal(2);
        await worker.close();
    });
    mocha_1.it('emits drained event when all jobs have been processed', async function () {
        const worker = new worker_1.Worker(queueName, async (job) => { }, {
            drainDelay: 1,
        });
        const drained = new Promise(resolve => {
            worker.once('drained', resolve);
        });
        await queue.add('test', { foo: 'bar' });
        await queue.add('test', { foo: 'baz' });
        await drained;
        const jobs = await queue.getJobCountByTypes('completed');
        chai_1.expect(jobs).to.be.equal(2);
        await worker.close();
    });
    mocha_1.it('should emit an event when a job becomes active', async () => {
        const worker = new worker_1.Worker(queueName, async (job) => { });
        await queue.add('test', {});
        const completed = new Promise(resolve => {
            worker.once('active', function () {
                worker.once('completed', async function () {
                    await worker.close();
                    resolve();
                });
            });
        });
        await completed;
    });
    mocha_1.it('should listen to global events', async () => {
        const worker = new worker_1.Worker(queueName, async (job) => { });
        let state;
        queueEvents.on('waiting', function () {
            chai_1.expect(state).to.be.undefined;
            state = 'waiting';
        });
        queueEvents.once('active', function () {
            chai_1.expect(state).to.be.equal('waiting');
            state = 'active';
        });
        const completed = new Promise(resolve => {
            queueEvents.once('completed', async function () {
                chai_1.expect(state).to.be.equal('active');
                resolve();
            });
        });
        await queue.add('test', {});
        await completed;
        await worker.close();
    });
    mocha_1.it('should trim events automatically', async () => {
        const worker = new worker_1.Worker('test', async () => { });
        const trimmedQueue = new classes_1.Queue('test', {
            streams: {
                events: {
                    maxLen: 0,
                },
            },
        });
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        const waitForCompletion = new Promise(resolve => {
            worker.on('drained', resolve);
        });
        await waitForCompletion;
        await worker.close();
        const client = await trimmedQueue.client;
        const [[id, [_, event]]] = await client.xrange(trimmedQueue.keys.events, '-', '+');
        chai_1.expect(event).to.be.equal('drained');
        const eventsLength = await client.xlen(trimmedQueue.keys.events);
        chai_1.expect(eventsLength).to.be.equal(1);
        await trimmedQueue.close();
    });
    mocha_1.it('should trim events manually', async () => {
        const trimmedQueue = new classes_1.Queue('test-manual');
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        await trimmedQueue.add('test', {});
        const client = await trimmedQueue.client;
        let eventsLength = await client.xlen(trimmedQueue.keys.events);
        chai_1.expect(eventsLength).to.be.equal(4);
        await trimmedQueue.trimEvents(0);
        eventsLength = await client.xlen(trimmedQueue.keys.events);
        chai_1.expect(eventsLength).to.be.equal(0);
        await trimmedQueue.close();
    });
});
//# sourceMappingURL=test_events.js.map