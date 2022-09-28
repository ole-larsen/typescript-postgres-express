import express from "express";
import {
  BaseController,
} from "../base.controller";
import {ICRUDController} from "../infrastructure/interface/interface.controller";

import {Service} from "../services/app.service";
import {USER_REPOSITORY} from "../services/app.constants";
import {UserEntity} from "./user.entity";
import {IUserServiceRepository} from "../infrastructure/database/postgres/interface/user.repository.interface";
import {AuthController} from "../auth/auth.controller";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {GetUsersResponse} from "./response/get.users.response";
import {GetUserResponse} from "./response/get.user.response";
import {UpdateUserResponse} from "./response/update.user.response";
import {DeleteUserResponse} from "./response/delete.user.response";
import {HttpException} from "../infrastructure/exception/http.exception";

export class UsersController extends BaseController implements ICRUDController {
  repository: IUserServiceRepository;
  entity: string;

  constructor() {
    super();

    this.repository = Service.getRepository<IUserServiceRepository>(USER_REPOSITORY);
    this.entity = "userController";

    this.get    = this.get.bind(this);
    this.getOne = this.getOne.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);

    this.emitter.on(this.entity, (message) => {
      this.compileLogger(this.entity, message);
    });
  }

  private createFirstUser(): Promise<UserEntity[]> {
    return new Promise(async(resolve, reject) => {
      try {
        const root = await this.repository.create(new UserEntity(
          undefined,
          this.config.defaultUser.username,
          this.config.defaultUser.email,
          this.config.defaultUser.password,
          true,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined
        ));
        await Promise.all(["admin", "user", "user1", "user2", "user3", "user4", "user5", "manager", "manager1", "manager2", "manager3", "manager4", "manager5"].map(async(username) => {
          await this.repository.create(new UserEntity(
            undefined,
            username,
            username + "@example.com",
            this.config.defaultUser.password,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
          ));
        }));
        resolve([root]);
      } catch (e) {
        reject(e);
      }
    });
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("UserHttpException", code, message);
  }
  
  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.repository
      .get()
      .then((entities: UserEntity[]) => {
        if (entities.length === 0) {
          return this.createFirstUser();
        } else {
          return entities.filter((entity: UserEntity) => entity.removed === null || entity.removed === undefined);
        }
      })
      .then((entities: UserEntity[]) => {
        return res.status(HttpStatus.OK).json(new GetUsersResponse(entities.map((entity: UserEntity) => {
          return AuthController.getPublicUser(entity);
        })));
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
      .then((entity: UserEntity) => {
        if (entity) {
          return res.status(HttpStatus.OK).json(new GetUserResponse(AuthController.getPublicUser(entity)));
        }
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }

  public async create (req: express.Request, res: express.Response): Promise<express.Response> {
    try {
      await new AuthController().signup(req, res);
    } catch (e) {
      return res.status(HttpStatus.BAD_REQUEST).json({message: e.message});
    }
  }

  public update (req: express.Request, res: express.Response): Promise<express.Response> {
    const { id, email } = req.body;

    if (!id) {
      throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.ID_NOT_PROVIDED);
    }

    if (!email) {
      throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.EMAIL_NOT_PROVIDED);
    }

    return this.repository.getById(id as unknown as number)
      .then((entity: UserEntity) => {
        return BaseController
          .updateEntity(entity, req.body)
          .save();
      })
      .then((entity: UserEntity) => {
        return res.status(HttpStatus.OK).json(new UpdateUserResponse(AuthController.getPublicUser(entity)));
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
      .then((entity: UserEntity) => {
        if (entity === null) {
          throw this.error(HttpStatus.NOT_FOUND, HttpExceptionMessages.USER_NOT_FOUND);
        }
        return entity.remove();
      })
      .then((entity: UserEntity) => {
        return res.status(HttpStatus.OK).json(new DeleteUserResponse(AuthController.getPublicUser(entity)));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }
}