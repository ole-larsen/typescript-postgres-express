import {IAccountServiceRepository} from "../infrastructure/database/postgres/interface/account.repository.interface";
import {AccountEntity} from "./account.entity";
import {BaseRepository} from "../base.repository";

import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {QueryResult} from "pg";
import {HttpException} from "../infrastructure/exception/http.exception";

export class AccountRepository extends BaseRepository implements IAccountServiceRepository {
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

    this.selectQuery = `SELECT ${this.accountsTable}.id,
         ${this.accountsTable}.name,
         ${this.accountsTable}.email,
         ${this.accountsTable}.status,
         ${this.accountsTable}.enabled,
         ${this.accountsTable}.created,
         ${this.accountsTable}.updated,
         ${this.accountsTable}.removed,
         array_remove(ARRAY_AGG(${this.usersTable}.id), NULL) ${this.usersTable}
      FROM ${this.accountsTable}
      LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.account_id = ${this.accountsTable}."id")
      LEFT  JOIN ${this.usersTable} ON (${this.usersTable}.id = ${this.userAccountTable}.user_id)`;
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("AccountRepositoryException", code, message);
  }

  private errorHandler(e: Error): Error {
    if (e.message.includes("duplicate key value violates unique constraint")) {
      return this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "name already used"
      );
    }

    if (e.message.includes("invalid input syntax")) {
      return this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        e.message
      );
    }

    return this.error(
      HttpStatus.INTERNAL_SERVER_ERROR,
      e.message
    );
  }

  private async remap(entity: AccountEntity, relation: number[], response: QueryResult): Promise<AccountEntity> {
    try {
      await this.cleanupAccountUserRelations(entity.id);
      await this.refreshUserAccountRelations(entity.id, relation);
    } catch (e) {
      throw this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "unable to reload relations"
      );
    }
    const [row] = (response.rows as unknown as AccountEntity[]);
    return row;
  }

  private getOne (field: string, value: number | string | boolean): Promise<AccountEntity> {
    return super.getOneQuery(this.accountsTable, field, value)
      .then((result: QueryResult) => {
        if (result && result.rows && result.rows.length === 1) {
          const [entity] =  result.rows.map((row) => {
            return new AccountEntity(
              row.id,
              row.name,
              row.email,
              row.status,
              row.enabled,
              row.created,
              row.updated,
              row.removed,
              row.users);
          });
          return entity;
        }
        throw this.error(
          HttpStatus.NOT_FOUND,
          field + ": " + HttpExceptionMessages.ACCOUNT_NOT_FOUND
        );
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }

  public get (): Promise<AccountEntity[]> {
    return this.getQuery(this.accountsTable)
      .then((result: QueryResult) => {
        return result && result.rows
          ? result.rows.map((row) => {
            return new AccountEntity(
              row.id,
              row.name,
              row.email,
              row.status,
              row.enabled,
              row.created,
              row.updated,
              row.removed,
              row.users,
            );
          })
          : [];
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.message
        );
      });
  }

  public getById (id: number): Promise<AccountEntity> {
    return this.getOne("id", id);
  }

  public async getByName (name: string): Promise<AccountEntity> {
    try {
      return await this.getOne("name", name);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public create (entity: AccountEntity): Promise<AccountEntity> {
    return this.database
      .client
      .query(
        `INSERT INTO ${this.accountsTable} (
        name, 
        email, 
        status,
        enabled) VALUES ($1, $2, $3, $4) RETURNING *`,
        [
          entity.name,
          entity.email,
          entity.status,
          entity.enabled || true
        ]
      )
      .then((response: QueryResult) => {
        const account = response?.rows?.[0];
        return this.remap(account, entity.users, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
    });
  }

  public async update (entity: AccountEntity): Promise<AccountEntity> {
    return this.database
      .client
      .query(
        `UPDATE ${this.accountsTable}
           SET name = $2,
               email = $3,
               status = $4,
               enabled = $5
           WHERE id = $1 RETURNING *;`,
        [
          entity.id,
          entity.name,
          entity.email,
          entity.status,
          entity.enabled
        ]
      )
      .then((response: QueryResult) => {
        return this.remap(entity, entity.users, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }
}
