import {Service} from "../services/app.service";
import {TASK_REPOSITORY, POSTGRES_SERVICE} from "../services/app.constants";
import {ITaskServiceRepository} from "../infrastructure/database/postgres/interface/task.repository.interface";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";
import {QueryResult} from "pg";

export class TaskEntity {
  public save: () => Promise<TaskEntity>;
  public remove: () => Promise<TaskEntity>;

  constructor(
    public          id: number,
    public          name: string,
    public          identity: string,
    public          config: {
      query: string;
      metrics: string;
      scheduler: string;
    },
    public          status: string,
    public          enabled: boolean,
    public          created?: Date,
    public          updated?: Date,
    public          removed?: Date
  ) {
    this.save = function (): Promise<TaskEntity> {
      return Service.getRepository<ITaskServiceRepository>(TASK_REPOSITORY).update(this);
    };

    const table = Service.getService<IPostgresFactory>(POSTGRES_SERVICE).tables.TASKS_TABLE;

    this.remove = function (): Promise<TaskEntity> {
      return Service.getRepository<ITaskServiceRepository>(TASK_REPOSITORY)
        .remove<TaskEntity>(this, table);
    };
  }
}
