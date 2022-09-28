import crypto from "crypto";
import {Service} from "../services/app.service";
import {IUserServiceRepository} from "../infrastructure/database/postgres/interface/user.repository.interface";
import {UserEntity} from "./user.entity";
import {BaseRepository} from "../base.repository";
import {QueryResult} from "pg";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {HttpException} from "../infrastructure/exception/http.exception";

export class UserRepository extends BaseRepository implements IUserServiceRepository {
  private readonly usersTable: string;
  private readonly rolesTable: string;
  private readonly userRoleTable: string;
  private readonly accountsTable: string;
  private readonly userAccountTable: string;

  constructor() {
    super();

    this.usersTable = this.database.tables.USERS_TABLE;
    this.rolesTable = this.database.tables.ROLES_TABLE;
    this.userRoleTable = this.database.tables.USER_ROLE_TABLE;
    this.accountsTable = this.database.tables.ACCOUNTS_TABLE;
    this.userAccountTable = this.database.tables.USER_ACCOUNT_TABLE;

    this.selectQuery = `SELECT ${this.usersTable}.id,
       ${this.usersTable}.username,
       ${this.usersTable}.email,
       ${this.usersTable}.password,
       ${this.usersTable}.enabled,
       ${this.usersTable}.secret,
       ${this.usersTable}.gravatar,
       ${this.usersTable}.password_reset_token,
       ${this.usersTable}.password_reset_expires,
       ${this.usersTable}.created,
       ${this.usersTable}.updated,
       ${this.usersTable}.removed,
       array_remove(ARRAY_AGG(DISTINCT ${this.rolesTable}.id), NULL) ${this.rolesTable},
       array_remove(ARRAY_AGG(DISTINCT ${this.accountsTable}.id), NULL) ${this.accountsTable}
      FROM ${this.usersTable}
       LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}.id)
       LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)

       LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.user_id = ${this.usersTable}.id)
       LEFT JOIN ${this.accountsTable} ON (${this.accountsTable}.id = ${this.userAccountTable}.account_id)`;
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("UserHttpException", code, message);
  }
  
  errorHandler(e: Error): Error {

    if (e.message.includes("duplicate key value violates unique constraint")) {
      return this.error(
        HttpStatus.CONFLICT,
        HttpExceptionMessages.USERNAME_ALREADY_USED
      );
    }

    if (e.message.includes("invalid input syntax")) {
      return this.error(
        HttpStatus.BAD_REQUEST,
        e.message
      );
    }

    return this.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      e.message
    );
  }

  async remap(entity: UserEntity, response: QueryResult): Promise<UserEntity> {
    try {
      if (entity.roles) {
        await this.cleanupUserRoleRelations(entity.id);
        await this.refreshRoleUserRelations(entity.id, entity.roles);
      }
    } catch (e) {
      throw this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
    try {
      if (entity.accounts) {
        await this.cleanupUserAccountRelations(entity.id);
        await this.refreshAccountUserRelations(entity.id, entity.accounts);
      }
    } catch (e) {
      throw this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
    const [row] = (response.rows as unknown as UserEntity[]);
    return row;
  }

  private static gravatar (email: string, size: number = 200): string {
    if (!email) {
      return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
  }

  private async getOne (field: string, value: number | string): Promise<UserEntity> {
    return this.getOneQuery(this.usersTable, field, value)
      .then((result: QueryResult) => {
        if (result && result.rows && result.rows.length === 1) {
          const [entity] = result.rows.map((row) => {
            return new UserEntity(
              row.id,
              row.username,
              row.email,
              row.password,
              row.enabled,
              row.secret,
              row.gravatar,
              row.password_reset_token,
              row.password_reset_expires,
              row.created,
              row.updated,
              row.removed,
              row.roles,
              row.accounts
            );
          });
          return entity;
        }
        throw this.error(
          HttpStatus.NOT_FOUND,
          field + ": " + HttpExceptionMessages.USER_NOT_FOUND
        );
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }

  public get (): Promise<UserEntity[]> {
    return this.getQuery(this.usersTable)
      .then((result: QueryResult) => {
        return result && result.rows
          ? result.rows.map(row => new UserEntity(
            row.id,
            row.username,
            row.email,
            undefined,
            row.enabled,
            undefined,
            row.gravatar,
            undefined,
            undefined,
            row.created,
            row.updated,
            undefined,
            row.roles,
            row.accounts))
          : [];
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.message
        );
      });
  }

  public getByPasswordResetToken (token: string): Promise<UserEntity> {
    return this.database
      .client
      .query(`
          ${this.selectQuery}
          WHERE ${this.usersTable}.password_reset_token = $1
          AND    ${this.usersTable}.password_reset_expires >= FLOOR(EXTRACT(epoch FROM NOW()) * 1000)
          GROUP BY ${this.usersTable}.id;`, [token])
      .then((result: QueryResult) => {
        if (result && result.rows && result.rows.length === 1) {
          const [entity] = result.rows.map((row) => {
            return new UserEntity(
              row.id,
              row.username,
              row.email,
              row.password,
              row.enabled,
              row.secret,
              row.gravatar,
              row.password_reset_token,
              row.password_reset_expires,
              row.created,
              row.updated,
              row.removed,
              row.roles,
              row.accounts
            );
          });
          return entity;
        }
        throw this.error(
          HttpStatus.NOT_FOUND,
          HttpExceptionMessages.USER_NOT_FOUND
        );
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }

  public getById (id: number): Promise<UserEntity> {
    return this.getOne("id", id);
  }

  public async getByUsername (username: string): Promise<UserEntity>  {
    try {
      return await this.getOne("username", username);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public async getByEmail (email: string): Promise<UserEntity> {
    try {
      return await this.getOne("email", email);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public async getByName (email: string): Promise<UserEntity> {
    try {
      return await this.getOne("email", email);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public async create (entity: UserEntity): Promise<UserEntity> {
    return this.database
      .client
      .query(
        `INSERT INTO ${this.usersTable} ("username", "email", "gravatar", "password" , "enabled") 
                              VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
        [
          entity.username,
          entity.email,
          UserRepository.gravatar(entity.email),
          await Service.hash(entity.password),
          true
        ]
      )
      .then((response: QueryResult) => {
        return this.remap(entity, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
    } );
  }

  public update (entity: UserEntity): Promise<UserEntity> {
    return this.database
      .client
      .query(
        `UPDATE ${this.usersTable}
         SET username = $2,
             email = $3,
             password = $4,
             enabled = $5,
             secret = $6,
             gravatar = $7,
             password_reset_token = $8,
             password_reset_expires = $9,
             removed = $10
         WHERE id = $1 RETURNING *;`,
        [
          entity.id,
          entity.username,
          entity.email,
          entity.password,
          entity.enabled,
          entity.secret,
          UserRepository.gravatar(entity.email),
          entity.passwordResetToken,
          entity.passwordResetExpires,
          entity.removed
        ]
      )
      .then((response: QueryResult) => {
        return this.remap(entity, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }
}
