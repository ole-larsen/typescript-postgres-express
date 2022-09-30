import express from "express";
import logger, {Logger} from "./infrastructure/util/logger";
import {Service} from "./services/app.service";
import {
  CONFIG_SERVICE,
  EMITTER_SERVICE,
  LOGGER_SERVICE,
} from "./services/app.constants";
import {Config} from "./infrastructure/util/secrets";
import {PublicUser, UserEntity} from "./users/user.entity";
import {EventEmitter} from "events";
import {AccountEntity} from "./accounts/account.entity";
import {HttpException} from "./infrastructure/exception/http.exception";
import {AnyDayVariable} from "app";

export abstract class BaseController {
  config:     Config
  emitter:    EventEmitter
  logger:     Logger

  constructor() {
    this.config = Service.getService<Config>(CONFIG_SERVICE);
    this.emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
    this.logger = Service.getService<Logger>(LOGGER_SERVICE);
  }

  public static updateEntity<T> (entity: T, body: AnyDayVariable): T {
    for (const field in body) {
      if (body.hasOwnProperty(field)) {
        const value = body[field];
        if (entity.hasOwnProperty(field)) {
          Object.defineProperty(entity, field, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        }
      }
    }
    return entity;
  }

  abstract get (req: express.Request, res: express.Response): Promise<express.Response>;

  log(entity: string, method: string, message: string | Error | UserEntity | PublicUser | AccountEntity | AccountEntity[], code: number): void {
    this.emitter.emit(entity, {
      method: method,
      response: message,
      code: code
    });
  }

  compileLogger (entity: string, message: {method: string; response: string | Error | UserEntity | PublicUser | AccountEntity; code: number}): void {
    if (message.response instanceof Error) {
      logger.error(`${entity} ${message.method} ${message.response.message} ${message.code}`);
    } else {
      logger.info(`${entity} ${message.method} ${message.response} ${message.code}`);
    }
  }

  exceptionError(name: string, code: number, message: string): HttpException {
    const error: HttpException = new HttpException(code, message);
    error.statusCode = code;
    error.name = name;

    if (error.name !== "GetOneTaskRepositoryHttpException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneUserRepositoryHttpException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneRoleRepositoryHttpException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneAccountRepositoryHttpException") {
      this.logger.error(message, { service: name, code: code });
    }

    return error;
  }
}


