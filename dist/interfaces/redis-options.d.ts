import IORedis from 'ioredis';
export declare type RedisOptions = IORedis.RedisOptions & {
    skipVersionCheck?: boolean;
};
export declare type ConnectionOptions = RedisOptions | IORedis.Redis;
