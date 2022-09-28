import {IRoleServiceRepository} from "../infrastructure/database/postgres/interface/role.repository.interface";
import {RoleEntity} from "./role.entity";
import {BaseRepository} from "../base.repository";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {QueryResult} from "pg";
import {HttpException} from "../infrastructure/exception/http.exception";

export class RoleRepository extends BaseRepository implements IRoleServiceRepository {
  private readonly usersTable: string;
  private readonly rolesTable: string;
  private readonly userRoleTable: string;

  constructor() {
    super();

    this.usersTable = this.database.tables.USERS_TABLE;
    this.rolesTable = this.database.tables.ROLES_TABLE;
    this.userRoleTable = this.database.tables.USER_ROLE_TABLE;

    this.selectQuery = `SELECT ${this.rolesTable}.id,
             ${this.rolesTable}.title,
             ${this.rolesTable}.description,
             ${this.rolesTable}.enabled,
             ${this.rolesTable}.created,
             ${this.rolesTable}.updated,
             ${this.rolesTable}.removed,
             array_remove(ARRAY_AGG(${this.usersTable}.id), NULL) ${this.usersTable}
      FROM ${this.rolesTable}
      LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.role_id = ${this.rolesTable}.id)
      LEFT JOIN ${this.usersTable} ON (${this.usersTable}.id = ${this.userRoleTable}.user_id)`;
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("RoleRepositoryException", code, message);
  }
  
  private errorHandler(e: Error): Error {
    if (e.message.includes("duplicate key value violates unique constraint")) {
      return this.error(
        HttpStatus.CONFLICT,
        "name already used");
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

  private async remap(entity: RoleEntity, relation: number[], response: QueryResult): Promise<RoleEntity> {
    try {
      if (entity && entity.id && entity.users) {
        await this.cleanupRoleUserRelations(entity.id);
        await this.refreshUserRoleRelations(entity.id, entity.users);
      }
    } catch (e) {
      throw this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        "unable to reload relations"
      );
    }
    const [row] = (response.rows as unknown as RoleEntity[]);
    return row;
  }

  private getOne (field: string, value: string | number): Promise<RoleEntity> {
    return super.getOneQuery(this.rolesTable, field, value)
      .then((result: QueryResult) => {
        if (result && result.rows && result.rows.length === 1) {
          const [entity] = result.rows.map((row) => {
            return new RoleEntity(
              row.id,
              row.title,
              row.description,
              row.enabled,
              row.created,
              row.updated,
              row.removed,
              row.users
            );
          });
          return entity;
        }
        throw this.error(
          HttpStatus.NOT_FOUND,
          field + ": " + HttpExceptionMessages.ROLE_NOT_FOUND
        );
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }

  public get (): Promise<RoleEntity[]> {
    return this.getQuery(this.rolesTable)
      .then((result: QueryResult) => {
        return result && result.rows
            ? result.rows.map((row) => new RoleEntity(
              row.id,
              row.title,
              row.description,
              row.enabled,
              row.created,
              row.updated,
              row.removed,
              row.users))
            : [];
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.message
        );
      });
  }

  public getById (id: number): Promise<RoleEntity> {
    return this.getOne("id", id);
  }

  public async getByName (title: string): Promise<RoleEntity> {
    try {
      return await this.getOne("title", title);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public create (entity: RoleEntity): Promise<RoleEntity> {
    return this.database
          .client
          .query(
          `INSERT INTO ${this.rolesTable} (title, description, enabled) VALUES ($1, $2, $3) RETURNING *;`,
          [
            entity.title,
            entity.description ? entity.description : "",
            true
          ]
        )
        .then((response: QueryResult) => {
          return this.remap(entity, entity.users, response);
        })
        .catch((e: Error) => {
          throw this.errorHandler(e);
        });
  }

  public update (entity: RoleEntity): Promise<RoleEntity> {
    return this.database
      .client
      .query(
        `UPDATE ${this.rolesTable}
             SET title = $2,
                 description = $3,
                 enabled = $4,
                 removed = $5
             WHERE id = $1 RETURNING *;`,
        [
          entity.id,
          entity.title,
          entity.description ? entity.description : "",
          entity.enabled,
          entity.removed,
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
