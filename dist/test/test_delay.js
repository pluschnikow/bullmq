"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const classes_1 = require("@src/classes");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const uuid_1 = require("uuid");
const worker_1 = require("@src/classes/worker");
const queue_events_1 = require("@src/classes/queue-events");
const queue_scheduler_1 = require("@src/classes/queue-scheduler");
mocha_1.describe('Delayed jobs', function () {
    this.timeout(15000);
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
    mocha_1.it('should process a delayed job only after delayed time', async function () {
        const delay = 1000;
        const queueScheduler = new queue_scheduler_1.QueueScheduler(queueName);
        await queueScheduler.waitUntilReady();
        const queueEvents = new queue_events_1.QueueEvents(queueName);
        await queueEvents.waitUntilReady();
        const worker = new worker_1.Worker(queueName, async (job) => { });
        const timestamp = Date.now();
        let publishHappened = false;
        queueEvents.on('delayed', () => {
            console.log('delayed!');
            publishHappened = true;
        });
        const completed = new Promise((resolve, reject) => {
            queueEvents.on('completed', async function () {
                try {
                    chai_1.expect(Date.now() > timestamp + delay);
                    const jobs = await queue.getWaiting();
                    chai_1.expect(jobs.length).to.be.equal(0);
                    const delayedJobs = await queue.getDelayed();
                    chai_1.expect(delayedJobs.length).to.be.equal(0);
                    chai_1.expect(publishHappened).to.be.eql(true);
                    await worker.close();
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            });
        });
        const job = await queue.add('test', { delayed: 'foobar' }, { delay });
        chai_1.expect(job.id).to.be.ok;
        chai_1.expect(job.data.delayed).to.be.eql('foobar');
        chai_1.expect(job.opts.delay).to.be.eql(delay);
        await completed;
        await queueScheduler.close();
        await queueEvents.close();
    });
    mocha_1.it('should process delayed jobs in correct order', async function () {
        let order = 0;
        const queueScheduler = new queue_scheduler_1.QueueScheduler(queueName);
        await queueScheduler.waitUntilReady();
        const processing = new Promise((resolve, reject) => {
            const processor = async (job) => {
                order++;
                try {
                    chai_1.expect(order).to.be.equal(job.data.order);
                    if (order === 10) {
                        resolve(worker.close());
                    }
                }
                catch (err) {
                    reject(err);
                }
            };
            const worker = new worker_1.Worker(queueName, processor);
            worker.on('failed', function (job, err) {
                err.job = job;
            });
        });
        await Promise.all([
            queue.add('test', { order: 1 }, { delay: 100 }),
            queue.add('test', { order: 6 }, { delay: 600 }),
            queue.add('test', { order: 10 }, { delay: 1000 }),
            queue.add('test', { order: 2 }, { delay: 200 }),
            queue.add('test', { order: 9 }, { delay: 900 }),
            queue.add('test', { order: 5 }, { delay: 500 }),
            queue.add('test', { order: 3 }, { delay: 300 }),
            queue.add('test', { order: 7 }, { delay: 700 }),
            queue.add('test', { order: 4 }, { delay: 400 }),
            queue.add('test', { order: 8 }, { delay: 800 }),
        ]);
        await processing;
        await queueScheduler.close();
    });
    /*
    it('should process delayed jobs in correct order even in case of restart', function(done) {
      this.timeout(15000);
  
      var QUEUE_NAME = 'delayed queue multiple' + uuid();
      var order = 1;
  
      queue = new Queue(QUEUE_NAME);
  
      var fn = function(job, jobDone) {
        expect(order).to.be.equal(job.data.order);
        jobDone();
  
        if (order === 4) {
          queue.close().then(done, done);
        }
  
        order++;
      };
  
      Bluebird.join(
        queue.add({ order: 2 }, { delay: 300 }),
        queue.add({ order: 4 }, { delay: 500 }),
        queue.add({ order: 1 }, { delay: 200 }),
        queue.add({ order: 3 }, { delay: 400 }),
      )
        .then(function() {
          //
          // Start processing so that jobs get into the delay set.
          //
          queue.process(fn);
          return Bluebird.delay(20);
        })
        .then(function() {
          //We simulate a restart
          // console.log('RESTART');
          // return queue.close().then(function () {
          //   console.log('CLOSED');
          //   return Promise.delay(100).then(function () {
          //     queue = new Queue(QUEUE_NAME);
          //     queue.process(fn);
          //   });
          // });
        });
    });
  */
    mocha_1.it('should process delayed jobs with exact same timestamps in correct order (FIFO)', async function () {
        let order = 1;
        const queueScheduler = new queue_scheduler_1.QueueScheduler(queueName);
        await queueScheduler.waitUntilReady();
        const processing = new Promise((resolve, reject) => {
            const processor = async (job) => {
                try {
                    chai_1.expect(order).to.be.equal(job.data.order);
                    if (order === 12) {
                        resolve(worker.close());
                    }
                }
                catch (err) {
                    reject(err);
                }
                order++;
            };
            const worker = new worker_1.Worker(queueName, processor);
            worker.on('failed', function (job, err) {
                err.job = job;
            });
        });
        const now = Date.now();
        const promises = [];
        let i = 1;
        for (i; i <= 12; i++) {
            promises.push(queue.add('test', { order: i }, {
                delay: 1000,
                timestamp: now,
            }));
        }
        await Promise.all(promises);
        await processing;
        await queueScheduler.close();
    });
});
//# sourceMappingURL=test_delay.js.map