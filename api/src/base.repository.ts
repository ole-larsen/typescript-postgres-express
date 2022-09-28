import { Service } from "./services/app.service";
import { EMITTER_SERVICE, LOGGER_SERVICE, POSTGRES_SERVICE } from "./services/app.constants";
import { EventEmitter } from "events";
import { TaskEntity } from "./tasks/task.entity";
import { AccountEntity } from "./accounts/account.entity";
import { UserEntity } from "./users/user.entity";
import { RoleEntity, USER_ROLE_ID } from "./roles/role.entity";
import { IPostgresFactory } from "./infrastructure/database/postgres/factory/postgres.factory.interface";
import { Logger } from "./infrastructure/util/logger";
import { QueryResult } from "pg";
import { HttpException } from "./infrastructure/exception/http.exception";

export abstract class BaseRepository {
  database: IPostgresFactory;
  emitter:  EventEmitter;
  selectQuery: string;
  logger: Logger;

  protected constructor() {
    this.database = Service.getService<IPostgresFactory>(POSTGRES_SERVICE);
    this.emitter  = Service.getService<EventEmitter>(EMITTER_SERVICE);
    this.logger   = Service.getService<Logger>(LOGGER_SERVICE);
  }

  protected cleanupAccountUserRelations(entityId: number): Promise<QueryResult> {
    return this.database.client.query(`
      DELETE
      FROM ${this.database.tables.USER_ACCOUNT_TABLE}
      WHERE account_id = $1`, [entityId]);
  }

  protected cleanupUserAccountRelations(entityId: number): Promise<QueryResult> {
    return this.database.client.query(`
      DELETE FROM ${this.database.tables.USER_ACCOUNT_TABLE}
      WHERE user_id = $1`, [entityId]);
  }

  protected refreshUserAccountRelations(entityId: number, users: number[]): Promise<QueryResult[]> {
    const promises: Promise<QueryResult>[] = [];

    users.forEach((userId: number) => {
      if (userId) {
        promises.push(this.database.client.query(`
          INSERT INTO ${this.database.tables.USER_ACCOUNT_TABLE}
          SELECT u.id, a.id
          FROM ${this.database.tables.ACCOUNTS_TABLE} a
              LEFT JOIN ${this.database.tables.USERS_TABLE} u ON u.id = $1
          WHERE a.id = $2`, [userId, entityId]));
      }
    });

    return Promise.all(promises);
  }

  protected refreshAccountUserRelations(entityId: number, accounts: number[]): Promise<QueryResult[]> {
    const promises: Promise<QueryResult>[] = [];

    accounts.forEach((accountId) => {
      promises.push(this.database.client.query(`
          INSERT INTO ${this.database.tables.USER_ACCOUNT_TABLE}
          SELECT u.id, a.id
          FROM ${this.database.tables.USERS_TABLE} u
             LEFT JOIN ${this.database.tables.ACCOUNTS_TABLE} a ON a.id = $1
          WHERE u.id = $2`, [accountId, entityId]));
    });

    return Promise.all(promises);
  }

  protected cleanupRoleUserRelations(entityId: number): Promise<QueryResult> {
    return this.database.client.query(`
      DELETE
      FROM ${this.database.tables.USER_ROLE_TABLE}
      WHERE role_id = $1`, [entityId]);
  }

  protected cleanupUserRoleRelations(entityId: number): Promise<QueryResult> {
    return this.database.client.query(`
      DELETE FROM ${this.database.tables.USER_ROLE_TABLE}
      WHERE user_id = $1`, [entityId]);
  }

  protected refreshUserRoleRelations(entityId: number, users: number[]): Promise<QueryResult[]> {
    const promises: Promise<QueryResult>[] = [];

    users.forEach((userId: number) => {
      promises.push(this.database.client.query(`
        INSERT INTO ${this.database.tables.USER_ROLE_TABLE}
        SELECT u.id, r.id
        FROM ${this.database.tables.ROLES_TABLE} r
                 LEFT JOIN ${this.database.tables.USERS_TABLE} u ON u.id = $1
        WHERE r.id = $2`, [userId, entityId]));
    });

    return Promise.all(promises);
  }

  protected refreshRoleUserRelations(entityId: number, roles: number[]): Promise<QueryResult[]> {
    const promises: Promise<QueryResult>[] = [];

    roles.forEach((roleId: number) => {
      promises.push(this.database.client.query(`
        INSERT INTO ${this.database.tables.USER_ROLE_TABLE}
        SELECT u.id, r.id
        FROM ${this.database.tables.USERS_TABLE} u
             LEFT JOIN ${this.database.tables.ROLES_TABLE} r ON r.id = $1
        WHERE u.id = $2`, [
        roleId ? roleId : USER_ROLE_ID, entityId]));
    });

    return Promise.all(promises);
  }

  protected delete(table: string, entityId: number): Promise<QueryResult> {
    return this.database.client.query(
      `DELETE FROM ${table}
             WHERE id = $1;`, [entityId]
    );
  }

  protected softDelete(table: string, entityId: number): Promise<QueryResult> {
    return this.database.client.query(
      `UPDATE ${table}
             SET removed = NOW(),
                 enabled = FALSE
             WHERE id = $1;`, [
        entityId
      ]);
  }

  protected exceptionError(name: string, code: number, message: string): HttpException {
    const error: HttpException = new HttpException(code, message);

    error.name = name;
    error.statusCode = code;

    if (error.name !== "GetOneTaskRepositoryException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneUserRepositoryException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneRoleRepositoryException") {
      this.logger.error(message, { service: name, code: code });
    }

    if (error.name !== "GetOneAccountRepositoryException") {
      this.logger.error(message, { service: name, code: code });
    }

    return error;
  }

  public async remove<T extends
    UserEntity |
    RoleEntity |
    AccountEntity |
    TaskEntity> (entity: T, table: string): Promise<T> {
    try {
      switch (table) {
        case this.database.tables.ACCOUNTS_TABLE:
          await this.cleanupAccountUserRelations(entity.id);
          break;
        case this.database.tables.USERS_TABLE:
          await this.cleanupUserRoleRelations(entity.id);
          await this.cleanupUserAccountRelations(entity.id);
          break;
        case this.database.tables.ROLES_TABLE:
          await this.cleanupRoleUserRelations(entity.id);
          break;
        case this.database.tables.TASKS_TABLE:
          break;
        default:
          break;
      }
      process.env.NODE_ENV === "test"
        ? await this.delete(table, entity.id)
        : await this.softDelete(table, entity.id);

      entity.removed = new Date();
      entity.enabled = false;

      return entity;
    } catch (e) {
      throw e;
    }
  }

  public getOneQuery (table: string, field: string, value: number | string | boolean): Promise<QueryResult> {
    return this.database
      .client
      .query(`
          ${this.selectQuery}
          WHERE ${table}."${field}" = $1
          AND ${table}.removed IS NULL
          GROUP BY ${table}."id"`, [value]);
  }

  public getQuery (table: string): Promise<QueryResult> {
    return this.database
      .client
      .query(`${this.selectQuery} WHERE ${table}.removed IS NULL 
        GROUP BY ${table}."id" ORDER BY "id" ASC`);
  }
}