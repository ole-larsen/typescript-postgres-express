import { Pool } from "pg";
import {RedisClientType, RedisModules, RedisScripts} from "redis";

export type Connections = {
    pool:        Pool,
    redis?:      RedisClientType<RedisModules, RedisScripts>,
    redisPub?:   RedisClientType<RedisModules, RedisScripts>,
    redisSub?:   RedisClientType<RedisModules, RedisScripts>,
};
declare module "passport-2fa-totp";

export type AnyDayVariable = any;