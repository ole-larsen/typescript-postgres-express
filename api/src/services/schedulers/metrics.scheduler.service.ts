import { BaseScheduler } from "./base.scheduler.service";
import {Service} from "../app.service";

import {
  SCHEDULER_SERVICE, TIMESERIES_REPOSITORY
} from "../app.constants";
import {TaskService} from "../task/task.service";
import {TaskEntity} from "../../tasks/task.entity";
import {ITimeSeriesServiceRepository} from "../../infrastructure/database/postgres/interface/timeseries.repository.interface";
import {TimeSeriesEntity} from "../../timeseries/timeseries.entity";

export class MetricsSchedulerService extends BaseScheduler {
  private readonly taskEntity: TaskEntity;
  private readonly httpService: TaskService;
  private readonly repository: ITimeSeriesServiceRepository;

  constructor(entity: TaskEntity) {
    super(entity.config.scheduler);

    this.taskEntity = entity;
    this.httpService = Service.getService<TaskService>(SCHEDULER_SERVICE);
    this.repository = Service.getRepository(TIMESERIES_REPOSITORY);
  }

  private extract(metric: string, metrics: any) {
    return getValue(metrics);

    function getValue(obj: any): any {
      for (const prop in obj) {
        if (typeof obj[prop] === "object") {
          return getValue(obj[prop]);
        } else {
          if (prop.trim().toLowerCase() === metric.trim().toLowerCase()) {
            return obj[prop];
          }
        }
      }
    }
  }
  
  public work(): void {
    this.httpService
      .getMetrics(this.taskEntity.config.query)
      .then(async (response) => {
        const value = this.extract(this.taskEntity.config.metrics, response);
        const metric = new TimeSeriesEntity(
          this.taskEntity.id,
          !isNaN(value) ? value : null,
          isNaN(value) ? value : null,
          new Date()
        );
        await this.repository.create(metric);
      })
      .catch((e: Error) => {
        this.logger.error(e.message, { service: "task-scheduler"});
      });
  }
}
