import {ITaskServiceRepository} from "../infrastructure/database/postgres/interface/task.repository.interface";
import {TaskEntity} from "./task.entity";
import {BaseRepository} from "../base.repository";
import {QueryResult} from "pg";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {HttpException} from "../infrastructure/exception/http.exception";

export class TaskRepository extends BaseRepository implements ITaskServiceRepository {
  public taskTable: string;

  constructor() {
    super();

    this.taskTable = this.database.tables.TASKS_TABLE;

    this.selectQuery = `SELECT ${this.taskTable}.id,
       ${this.taskTable}.name,
       ${this.taskTable}.identity,
       ${this.taskTable}.config,
       ${this.taskTable}.status,
       ${this.taskTable}.enabled,
       ${this.taskTable}.created,
       ${this.taskTable}.updated,
       ${this.taskTable}.removed
      FROM ${this.taskTable}`;
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("TaskRepositoryException", code, message);
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

  private remap(entity: TaskEntity, relations: number[], response: QueryResult) {
    const [rows] = (response.rows as unknown as TaskEntity[]);
    return rows;
  }

  private getOne (field: string, value: string | number): Promise<TaskEntity> {
    return this.getOneQuery(this.taskTable, field, value)
      .then((result: QueryResult) => {
        if (result && result.rows && result.rows.length === 1) {
          const [entity] = result.rows.map((row) => {
            return new TaskEntity(
              row.id,
              row.name,
              row.identity,
              row.config,
              row.status,
              row.enabled,
              row.created,
              row.updated,
              row.removed
            );
          });
          return entity;
        }
        return null;
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.NOT_FOUND,
          field + ": " + HttpExceptionMessages.TASK_NOT_FOUND
        );
      });
  }

  public get (): Promise<TaskEntity[]> {
    return this.getQuery(this.taskTable)
      .then((result: QueryResult) => {
        return result && result.rows
          ? result.rows.map(row => new TaskEntity(
            row.id,
            row.name,
            row.identity,
            row.config,
            row.status,
            row.enabled,
            row.created,
            row.updated,
            row.removed))
          : undefined;
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.message
        );
      });
  }

  public async getById (id: number): Promise<TaskEntity> {
    try {
      return await this.getOne("id", id);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public async getByName (name: string): Promise<TaskEntity> {
    try {
      return await this.getOne("name", name);
    } catch (e) {
      if (e.statusCode === HttpStatus.NOT_FOUND) {
        return null;
      }
      throw e;
    }
  }

  public upsert (entity: TaskEntity): Promise<TaskEntity> {
    return this.getById(entity.id)
      .then((taskEntity: TaskEntity) => {
        if (!taskEntity || taskEntity.id === null) {
          return this.create(entity);
        } else {
          entity.id = taskEntity.id;
          entity.enabled = taskEntity.enabled;
          entity.created = taskEntity.created;
          return this.update(entity);
        }
      })
      .catch((e: Error) => {
        throw this.error(
          HttpStatus.INTERNAL_SERVER_ERROR,
          e.message
        );
      });
  }

  public async saveBulk (entities: TaskEntity[]): Promise<number> {
    try {
      await Promise.all(entities.map(async (entity: TaskEntity) => {
        await this.upsert(entity);
      }));
      return entities.length;
    } catch (e) {
      throw this.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        e.message
      );
    }
  }

  public create (entity: TaskEntity): Promise<TaskEntity> {
    return this.database
      .client
      .query(
        `INSERT INTO ${this.taskTable} (
           name, identity, config, status, enabled) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          entity.name,
          entity.identity,
          entity.config,
          entity.status,
          entity.enabled || true
        ]
      )
      .then((response: QueryResult) => {
        return this.remap(entity, null, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }

  public update (entity: TaskEntity): Promise<TaskEntity> {
    return this.database
      .client
      .query(
        `UPDATE ${this.taskTable}
            SET  name = $2,
                 identity = $3,
                 config = $4,
                 status = $5,
                 enabled = $6,
                 removed = $7,
                 updated = $8
            WHERE id = $1 RETURNING *;`,
        [
          entity.id,
          entity.name,
          entity.identity,
          entity.config,
          entity.status,
          entity.enabled,
          entity.removed,
          new Date()
        ]
      )
      .then((response: QueryResult) => {
        return this.remap(entity, null, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
      });
  }
}
