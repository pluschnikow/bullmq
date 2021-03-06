"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const ioredis_1 = tslib_1.__importDefault(require("ioredis"));
const semver = tslib_1.__importStar(require("semver"));
const commands_1 = require("../commands");
class RedisConnection extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.opts = opts;
        if (!(opts instanceof ioredis_1.default)) {
            this.opts = Object.assign({ port: 6379, host: '127.0.0.1', retryStrategy: function (times) {
                    return Math.min(Math.exp(times), 20000);
                } }, opts);
        }
        else {
            this._client = opts;
        }
        this.initializing = this.init();
        this.initializing
            .then(client => client.on('error', this.emit.bind(this)))
            .catch(err => this.emit('error', err));
    }
    /**
     * Waits for a redis client to be ready.
     * @param {Redis} redis client
     */
    static async waitUntilReady(client) {
        return new Promise(function (resolve, reject) {
            if (client.status === 'ready') {
                resolve();
            }
            else {
                async function handleReady() {
                    client.removeListener('error', handleError);
                    await commands_1.load(client);
                    resolve();
                }
                function handleError(err) {
                    client.removeListener('ready', handleReady);
                    reject(err);
                }
                client.once('ready', handleReady);
                client.once('error', handleError);
            }
        });
    }
    get client() {
        return this.initializing;
    }
    async init() {
        const opts = this.opts;
        if (!this._client) {
            this._client = new ioredis_1.default(opts);
        }
        await RedisConnection.waitUntilReady(this._client);
        if (opts && opts.skipVersionCheck !== true && !this.closing) {
            const version = await this.getRedisVersion();
            if (semver.lt(version, RedisConnection.minimumVersion)) {
                throw new Error(`Redis version needs to be greater than ${RedisConnection.minimumVersion} Current: ${version}`);
            }
        }
        return this._client;
    }
    async disconnect() {
        const client = await this.client;
        if (client.status !== 'end') {
            let _resolve, _reject;
            const disconnecting = new Promise((resolve, reject) => {
                client.once('end', resolve);
                client.once('error', reject);
                _resolve = resolve;
                _reject = reject;
            });
            client.disconnect();
            try {
                await disconnecting;
            }
            finally {
                client.removeListener('end', _resolve);
                client.removeListener('error', _reject);
            }
        }
    }
    async reconnect() {
        const client = await this.client;
        return client.connect();
    }
    async close() {
        if (!this.closing) {
            this.closing = true;
            if (this.opts != this._client) {
                await this._client.quit();
            }
        }
    }
    async getRedisVersion() {
        const doc = await this._client.info();
        const prefix = 'redis_version:';
        const lines = doc.split('\r\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].indexOf(prefix) === 0) {
                return lines[i].substr(prefix.length);
            }
        }
    }
}
exports.RedisConnection = RedisConnection;
RedisConnection.minimumVersion = '5.0.0';
//# sourceMappingURL=redis-connection.js.map