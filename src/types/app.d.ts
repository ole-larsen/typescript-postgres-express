import { Pool } from "pg";
import {RedisClientType, RedisModules, RedisScripts} from "redis";
import {Mongoose} from "mongoose";

export type Connections = {
    pool:        Pool,
    redis?:      RedisClientType<RedisModules, RedisScripts>,
    redisPub?:   RedisClientType<RedisModules, RedisScripts>,
    redisSub?:   RedisClientType<RedisModules, RedisScripts>,
    mongodb?:    Mongoose
};
declare module "passport-2fa-totp";
