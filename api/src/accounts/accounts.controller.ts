import express from "express";
import {Service} from "../services/app.service";
import {AccountEntity} from "./account.entity";
import {IAccountServiceRepository} from "../infrastructure/database/postgres/interface/account.repository.interface";

import {
  BaseController,
} from "../base.controller";

import {
  ACCOUNT_REPOSITORY
} from "../services/app.constants";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {ICRUDController} from "../infrastructure/interface/interface.controller";
import {GetAccountsResponse} from "./response/get.accounts.response";
import {GetAccountResponse} from "./response/get.account.response";
import {CreateAccountResponse} from "./response/create.account.response";
import {UpdateAccountResponse} from "./response/update.account.response";
import {DeleteAccountResponse} from "./response/delete.account.response";
import {HttpException} from "../infrastructure/exception/http.exception";

export class AccountsController extends BaseController implements ICRUDController {
  entity: string;
  repository: IAccountServiceRepository;

  constructor() {
    super();

    this.repository = Service.getRepository<IAccountServiceRepository>(ACCOUNT_REPOSITORY);
    this.entity = "accountController";

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
    return super.exceptionError("AccountHttpException", code, message);
  }

  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.repository
      .get()
      .then((entities: AccountEntity[]) => {
        return res.status(HttpStatus.OK).json(new GetAccountsResponse(entities));
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(HttpStatus.BAD_REQUEST).json({message: e.message});
        }
        throw e;
      });
  }

  public getOne (req: express.Request, res: express.Response): Promise<express.Response> {
    const id = Number(req.params.id);
    return this.repository
      .getById(id)
      .then((entity: AccountEntity) => {
        return res.status(HttpStatus.OK).json(new GetAccountResponse(entity));
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
    email: string;
    status: string;
    users: number[];
    enabled: boolean;
  }) {
    if (!credentials.name) {
      throw this.error(HttpStatus.BAD_REQUEST, "name was not provided");
    }

    if (!credentials.email) {
      throw this.error(HttpStatus.BAD_REQUEST, "email was not provided");
    }
  }

  public async create (req: express.Request, res: express.Response): Promise<express.Response> {
    const { name, email, status, users, enabled } = req.body;
    try {
      await this.validateCreate(req.body);

      const account = await this.repository.getByName(name);

      if (account) {
        if (account.removed !== null) {
          account.removed = undefined;
          account.enabled = true;
          await account.save();
          const response = new CreateAccountResponse(account.id);
          return res.status(HttpStatus.OK).json(response);
        } else {
          throw this.error(HttpStatus.CONFLICT, HttpExceptionMessages.ACCOUNT_ALREADY_EXISTS);
        }
      }

      const entity = await this.repository
        .create(new AccountEntity(
          null,
          name,
          email,
          status,
          enabled,
          new Date(),
          new Date(),
          undefined,
          users
        ));

      const response = new CreateAccountResponse(entity.id);

      return res.status(HttpStatus.OK).json(response);
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
      throw this.error(HttpStatus.BAD_REQUEST, "id was not provided");
    }

    return this.repository
      .getById(id as unknown as number)
      .then(async (entity: AccountEntity) => {
        if (entity === null) {
          this.error(HttpStatus.NOT_FOUND, HttpExceptionMessages.ACCOUNT_NOT_FOUND);
        }
        const existEntity = await this.repository.getByName(name);
        if (existEntity) {
          if (existEntity.id !== entity.id) {
            throw this.error(HttpStatus.CONFLICT, HttpExceptionMessages.USERNAME_ALREADY_USED);
          }
        }
        return BaseController
          .updateEntity<AccountEntity>(entity, req.body)
          .save();
      })
      .then((entity: AccountEntity) => {
        return res.status(HttpStatus.OK).json(new UpdateAccountResponse(entity.id));
      })
      .catch((e: Error) => {
        if (e instanceof  HttpException) {
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
      .getById(id as unknown as number)
      .then((entity: AccountEntity) => {
        if (entity === null) {
          throw this.error(HttpStatus.NOT_FOUND, HttpExceptionMessages.ACCOUNT_NOT_FOUND);
        }
        return entity.remove();
      })
      .then((entity: AccountEntity) => {
        return res.status(HttpStatus.OK).json(new DeleteAccountResponse(entity.id));
      })
      .catch((e: Error) => {
        if (e instanceof  HttpException) {
          return res.status(e.statusCode).json({message: e.message});
        }
        throw e;
      });
  }
}