import express from "express";
import {
  BaseController,
} from "../base.controller";
import {ICRUDController} from "../infrastructure/interface/interface.controller";

import {TASK_REPOSITORY} from "../services/app.constants";
import {Service} from "../services/app.service";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {HttpException} from "../infrastructure/exception/http.exception";
import {ITaskServiceRepository} from "../infrastructure/database/postgres/interface/task.repository.interface";
import {TaskEntity} from "./task.entity";
import {DeleteTaskResponse} from "./response/delete.task.response";
import {UpdateTaskResponse} from "./response/update.task.response";
import {GetTaskResponse} from "./response/get.task.response";
import {GetTasksResponse} from "./response/get.tasks.response";
import {CreateTaskResponse} from "./response/create.task.response";

export class TasksController extends BaseController implements ICRUDController {
  entity: string;
  repository: ITaskServiceRepository;

  constructor() {
    super();
    this.repository = Service.getRepository<ITaskServiceRepository>(TASK_REPOSITORY);
    this.entity = "taskController";

    this.get = this.get.bind(this);
    this.getOne = this.getOne.bind(this);
    this.update = this.update.bind(this);
    this.create = this.create.bind(this);
    this.delete = this.delete.bind(this);

    this.emitter.on(this.entity, (message) => {
      this.compileLogger(this.entity, message);
    });
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("TaskHttpException", code, message);
  }
  
  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.repository
      .get()
      .then((entities: TaskEntity[]) => {
        return res.status(HttpStatus.OK).json(new GetTasksResponse(entities));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  public getOne (req: express.Request, res: express.Response): Promise<express.Response> {
    const id = Number(req.params.id);
    return this.repository
      .getById(id)
      .then((entity: TaskEntity) => {
        return res.status(HttpStatus.OK).json(new GetTaskResponse(entity));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  private validateCreate(credentials: {
    name: string;
    identity: string;
    config: {
      query: string;
      metrics: string;
      scheduler: string;
    };
    enabled: boolean;
  }) {
    if (!credentials.name) {
      throw this.error(HttpStatus.BAD_REQUEST, "name was not provided");
    }

    if (!credentials.identity) {
      throw this.error(HttpStatus.BAD_REQUEST, "identity was not provided");
    }

    if (!credentials.config) {
      throw this.error(HttpStatus.BAD_REQUEST, "config was not provided");
    }
  }

  public async create (req: express.Request, res: express.Response): Promise<express.Response> {
    const { name, identity, config, status, enabled } = req.body;
    try {
      await this.validateCreate(req.body);

      const task = await this.repository.getByName(name);

      if (task) {
        if (task.removed !== null) {
          task.removed = undefined;
          task.enabled = true;
          await task.save();
          return res.status(HttpStatus.OK).json(new CreateTaskResponse(task.id));
        } else {
          throw this.error(HttpStatus.CONFLICT, HttpExceptionMessages.TASK_ALREADY_EXISTS);
        }
      }

      const entity = await this.repository
        .create(new TaskEntity(
          null,
          name,
          identity,
          config,
          status,
          enabled
        ));
      return res.status(HttpStatus.OK).json(new CreateTaskResponse(entity.id));
    } catch (e) {
      if (e instanceof HttpException) {
        return res.status(e.statusCode).json({message: e.message});
      }
      throw e;
    }
  }

  public update (req: express.Request, res: express.Response): Promise<express.Response> {
    const { id, name } = req.body;

    if (!id) {
      throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.ID_NOT_PROVIDED);
    }

    if (!name) {
      throw this.error(HttpStatus.BAD_REQUEST, "name was not provided");
    }

    return this.repository
      .getById(id as unknown as number)
      .then((entity: TaskEntity) => {
        return BaseController
          .updateEntity<TaskEntity>(entity, req.body)
          .save();
      })
      .then(() => {
        return res.status(HttpStatus.OK).json(new UpdateTaskResponse(id));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  public delete (req: express.Request, res: express.Response): Promise<express.Response> {
    const { id } = req.body;

    if (!id) {
      throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.ID_NOT_PROVIDED);
    }

    return this.repository
      .getById(id)
      .then((entity: TaskEntity) => {
        return entity.remove();
      })
      .then((entity: TaskEntity) => {
        return res.status(HttpStatus.OK).json(new DeleteTaskResponse(entity.id));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }
}