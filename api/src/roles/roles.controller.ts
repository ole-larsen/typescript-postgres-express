import express from "express";
import {
  BaseController,
} from "../base.controller";
import {ICRUDController} from "../infrastructure/interface/interface.controller";

import {ROLE_REPOSITORY} from "../services/app.constants";
import {Service} from "../services/app.service";
import {RoleEntity} from "./role.entity";
import {IRoleServiceRepository} from "../infrastructure/database/postgres/interface/role.repository.interface";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {GetRolesResponse} from "./response/get.roles.response";
import {GetRoleResponse} from "./response/get.role.response";
import {CreateRoleResponse} from "./response/create.role.response";
import {UpdateRoleResponse} from "./response/update.role.response";
import {DeleteRoleResponse} from "./response/delete.role.response";
import {HttpException} from "../infrastructure/exception/http.exception";

export class RolesController extends BaseController implements ICRUDController {
  entity: string;
  repository: IRoleServiceRepository;

  constructor() {
    super();
    this.repository = Service.getRepository<IRoleServiceRepository>(ROLE_REPOSITORY);
    this.entity = "roleController";

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
    return super.exceptionError("RoleHttpException", code, message);
  }
  
  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.repository
      .get()
      .then((entities: RoleEntity[]) => {
        entities = entities
          .filter((entity: RoleEntity) => entity.removed === null || entity.removed === undefined);
        return res.status(HttpStatus.OK).json(new GetRolesResponse(entities));
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
      .then((entity: RoleEntity) => {
        return res.status(HttpStatus.OK).json(new GetRoleResponse(entity));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  public create (req: express.Request, res: express.Response): Promise<express.Response> {
    const { title, description, enabled } = req.body;

    if (!title) {
      throw this.error(HttpStatus.BAD_REQUEST, "title was not provided");
    }

    return this.repository
      .getByName(req.body.title)
      .then((entity: RoleEntity) => {
        if (entity) {
          if (entity.removed !== null) {
            entity.removed = undefined;
            entity.enabled = true;
            this.log(this.entity, "restore", entity, HttpStatus.OK);
            return entity.save();
          } else {
            throw this.error(HttpStatus.CONFLICT, "response already exists");
          }
        }
        return this.repository
          .create(new RoleEntity(
            null,
            title,
            description,
            enabled
          ));
      })
      .then((entity: RoleEntity) => {
        return res.status(HttpStatus.OK).json(new CreateRoleResponse(entity.id));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  public update (req: express.Request, res: express.Response): Promise<express.Response> {
    const { id, title } = req.body;

    if (!id) {
      throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.ID_NOT_PROVIDED);
    }

    if (!title) {
      throw this.error(HttpStatus.BAD_REQUEST, "title was not provided");
    }

    return this.repository
      .getById(id as unknown as number)
      .then((entity: RoleEntity) => {
        return BaseController
          .updateEntity<RoleEntity>(entity, req.body)
          .save();
      })
      .then((entity: RoleEntity) => {
        return res.status(HttpStatus.OK).json(new UpdateRoleResponse(entity.id));
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
      .then((entity: RoleEntity) => {
        return entity.remove();
      })
      .then((entity: RoleEntity) => {
        return res.status(HttpStatus.OK).json(new DeleteRoleResponse(entity.id));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }
}