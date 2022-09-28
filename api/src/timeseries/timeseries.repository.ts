import {ITimeSeriesServiceRepository} from "../infrastructure/database/postgres/interface/timeseries.repository.interface";
import {TimeSeriesEntity} from "./timeseries.entity";
import {BaseRepository} from "../base.repository";
import {QueryResult} from "pg";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";

import {TimeSeriesMetric} from "./timeseriesMetrics.entity";
import {HttpException} from "../infrastructure/exception/http.exception";

export class TimeSeriesRepository extends BaseRepository implements ITimeSeriesServiceRepository {
  private readonly tasksTable: string;
  private readonly timeSeriesTable: string;

  constructor() {
    super();

    this.tasksTable = this.database.tables.TASKS_TABLE;
    this.timeSeriesTable = this.database.tables.TIMESERIES_TABLE;

    this.selectQuery = `SELECT ${this.tasksTable}.id,
       ${this.tasksTable}.name,
       ${this.tasksTable}.identity,
       ${this.timeSeriesTable}.value as value,
       ${this.timeSeriesTable}.text
       FROM ${this.tasksTable}
       JOIN ${this.timeSeriesTable} ON (${this.timeSeriesTable}.task_id = ${this.tasksTable}.id)`;
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("TimeSeriesRepositoryException", code, message);
  }
  
  private errorHandler(e: Error): Error {
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

  private async responseHandler(entity: TimeSeriesEntity, response: QueryResult): Promise<TimeSeriesEntity> {
    const [row] = (response.rows as unknown as TimeSeriesEntity[]);
    return row;
  }

  private createPartitionBunch(created: Date) {
    const partition = `${this.timeSeriesTable}_${created.getFullYear()}_${created.getMonth() + 1}`;

    const fromDate = `${created.getFullYear()}-${
      created.getMonth() + 1
    }-01 00:00:00.000`;

    const to = new Date(
      Number(created.getFullYear()),
      created.getMonth() + 1,
      0,
    );
    to.setDate(to.getDate() + 1);
    to.setMonth(to.getMonth() + 1);

    const toDate = `${to.getFullYear()}-${
      to.getMonth() + 1
    }-${to.getDate()} 00:00:00.000`;

    return this.database
      .client
      .query(
      `CREATE TABLE IF NOT EXISTS ${partition} 
                     PARTITION OF ${this.timeSeriesTable} 
                     FOR VALUES FROM ('${fromDate}') 
                     TO ('${toDate}') PARTITION BY LIST (task_id);`,
    );
  }

  private createSubPartitionBunch(timeSeriesId: number, created: Date) {
    const parentPartition = `${
      this.timeSeriesTable
    }_${created.getFullYear()}_${created.getMonth() + 1}`;

    const partition = `${parentPartition}_${timeSeriesId}`;

    return this.database
      .client
      .query(
      `CREATE TABLE IF NOT EXISTS ${partition} 
                     PARTITION OF ${parentPartition} 
                     FOR VALUES IN ('${timeSeriesId}');`,
    );
  }


  public get (): Promise<TimeSeriesEntity[]> {
    return this.getQuery(this.tasksTable)
      .then((result: QueryResult) => {
        return result && result.rows
          ? result.rows.map(row => {
            return new TimeSeriesEntity(
              row.id,
              row.task_id,
              row.name,
              row.identity,
              row.value,
              row.text
            );
          })
          : [];
      })
      .catch((e: Error) => {
        throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, e.message);
      });
  }

  public getMetrics (): Promise<TimeSeriesMetric[]> {
    return this.database
      .client
      .query(this.selectQuery)
      .then((result: QueryResult) => {
        return result && result.rows
          ? result.rows.map(row => {
            return new TimeSeriesMetric(
              row.name,
              row.identity,
              row.value,
              row.text,
              row.created,
            );
          })
          : [];
      })
      .catch((e: Error) => {
        throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, e.message);
      });
  }

  public async create (entity: TimeSeriesEntity): Promise<TimeSeriesEntity> {
    try {
      await this.createPartitionBunch(entity.created);
      await this.createSubPartitionBunch(entity.taskId, entity.created);
    } catch (e) {
      throw this.error(HttpStatus.INTERNAL_SERVER_ERROR, e.message);
    }

    return this.database
      .client
      .query(
        `INSERT INTO ${this.timeSeriesTable} ("task_id", "value", "text") 
                              VALUES ($1, $2, $3) RETURNING *;`,
        [
          entity.taskId,
          entity.value,
          entity.text
        ]
      )
      .then((response: QueryResult) => {
        return this.responseHandler(entity, response);
      })
      .catch((e: Error) => {
        throw this.errorHandler(e);
    } );
  }
}
