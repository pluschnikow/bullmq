"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const classes_1 = require("@src/classes");
const utils_1 = require("@src/utils");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const lodash_1 = require("lodash");
const mocha_1 = require("mocha");
const uuid_1 = require("uuid");
const chai_1 = require("chai");
mocha_1.describe('stalled jobs', function () {
    let queue;
    let queueName;
    let client;
    mocha_1.beforeEach(function () {
        client = new ioredis_1.default();
        return client.flushdb();
    });
    mocha_1.beforeEach(async function () {
        queueName = 'test-' + uuid_1.v4();
        queue = new classes_1.Queue(queueName);
    });
    afterEach(async function () {
        await queue.close();
        return client.quit();
    });
    mocha_1.it('process stalled jobs when starting a queue', async function () {
        this.timeout(10000);
        const queueEvents = new classes_1.QueueEvents(queueName);
        await queueEvents.waitUntilReady();
        const concurrency = 4;
        const worker = new classes_1.Worker(queueName, async (job) => {
            return utils_1.delay(10000);
        }, {
            lockDuration: 1000,
            concurrency,
        });
        const allActive = new Promise(resolve => {
            worker.on('active', lodash_1.after(concurrency, resolve));
        });
        await worker.waitUntilReady();
        const jobs = await Promise.all([
            queue.add('test', { bar: 'baz' }),
            queue.add('test', { bar1: 'baz1' }),
            queue.add('test', { bar2: 'baz2' }),
            queue.add('test', { bar3: 'baz3' }),
        ]);
        await allActive;
        const queueScheduler = new classes_1.QueueScheduler(queueName, {
            stalledInterval: 100,
        });
        await queueScheduler.waitUntilReady();
        await worker.close(true);
        const allStalled = new Promise(resolve => {
            queueScheduler.on('stalled', lodash_1.after(concurrency, resolve));
        });
        const allStalledGlobalEvent = new Promise(resolve => {
            queueEvents.on('stalled', lodash_1.after(concurrency, resolve));
        });
        await allStalled;
        await allStalledGlobalEvent;
        const worker2 = new classes_1.Worker(queueName, async (job) => { }, { concurrency });
        const allCompleted = new Promise(resolve => {
            worker2.on('completed', lodash_1.after(concurrency, resolve));
        });
        await allCompleted;
        await queueEvents.close();
        await queueScheduler.close();
        await worker2.close();
    });
    mocha_1.it('fail stalled jobs that stall more than allowable stalled limit', async function () {
        this.timeout(6000);
        const concurrency = 4;
        const worker = new classes_1.Worker(queueName, async (job) => {
            return utils_1.delay(10000);
        }, {
            lockDuration: 1000,
            concurrency,
        });
        const allActive = new Promise(resolve => {
            worker.on('active', lodash_1.after(concurrency, resolve));
        });
        await worker.waitUntilReady();
        const jobs = await Promise.all([
            queue.add('test', { bar: 'baz' }),
            queue.add('test', { bar1: 'baz1' }),
            queue.add('test', { bar2: 'baz2' }),
            queue.add('test', { bar3: 'baz3' }),
        ]);
        await allActive;
        const queueScheduler = new classes_1.QueueScheduler(queueName, {
            stalledInterval: 100,
            maxStalledCount: 0,
        });
        await queueScheduler.waitUntilReady();
        await worker.close(true);
        const allFailed = new Promise(resolve => {
            queueScheduler.on('failed', lodash_1.after(concurrency, resolve));
        });
        await allFailed;
        await queueScheduler.close();
    });
    mocha_1.it('jobs not stalled while lock is extended', async function () {
        this.timeout(6000);
        const concurrency = 4;
        const worker = new classes_1.Worker(queueName, async (job) => {
            return utils_1.delay(10000);
        }, {
            lockDuration: 1000,
            concurrency,
        });
        const allActive = new Promise(resolve => {
            worker.on('active', lodash_1.after(concurrency, resolve));
        });
        await worker.waitUntilReady();
        await Promise.all([
            queue.add('test', { bar: 'baz' }),
            queue.add('test', { bar1: 'baz1' }),
            queue.add('test', { bar2: 'baz2' }),
            queue.add('test', { bar3: 'baz3' }),
        ]);
        await allActive;
        const queueScheduler = new classes_1.QueueScheduler(queueName, {
            stalledInterval: 100,
        });
        await queueScheduler.waitUntilReady();
        const allStalled = new Promise(resolve => {
            queueScheduler.on('stalled', lodash_1.after(concurrency, resolve));
        });
        await utils_1.delay(2000); // let worker to extend lock for several times
        const active = await queue.getActiveCount();
        chai_1.expect(active).to.be.equal(4);
        await worker.close(true);
        await allStalled;
        await queueScheduler.close();
    });
});
//# sourceMappingURL=test_stalled_jobs.js.map