/// <reference types="node" />
import { EventEmitter } from 'events';
import IORedis, { Redis } from 'ioredis';
import { ConnectionOptions } from '../interfaces';
export declare class RedisConnection extends EventEmitter {
    private opts?;
    static minimumVersion: string;
    private _client;
    private initializing;
    private closing;
    constructor(opts?: ConnectionOptions);
    /**
     * Waits for a redis client to be ready.
     * @param {Redis} redis client
     */
    static waitUntilReady(client: IORedis.Redis): Promise<unknown>;
    readonly client: Promise<Redis>;
    private init;
    disconnect(): Promise<void>;
    reconnect(): Promise<any>;
    close(): Promise<void>;
    private getRedisVersion;
}
