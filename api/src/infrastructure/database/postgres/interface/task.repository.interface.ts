import {TaskEntity} from "../../../../tasks/task.entity";
import {QueryResult} from "pg";

export interface ITaskServiceRepository {
  get(): Promise<TaskEntity[]>
  getById(id: number): Promise<TaskEntity>
  getByName(ticker: string): Promise<TaskEntity>
  saveBulk(entities: TaskEntity[]): Promise<number>;
  upsert(entity: TaskEntity): Promise<TaskEntity>
  create(entity: TaskEntity): Promise<TaskEntity>
  update(entity: TaskEntity): Promise<TaskEntity>
  remove<T extends TaskEntity>(entity: T, table: string): Promise<T>
}
