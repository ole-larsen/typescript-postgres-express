import { BaseScheduler } from "./base.scheduler.service";
import {Service} from "../app.service";

import {
  TASK_SERVICE, TIMESERIES_REPOSITORY
} from "../app.constants";
import {TaskService} from "../task/task.service";
import {TaskEntity} from "../../tasks/task.entity";
import {ITimeSeriesServiceRepository} from "../../infrastructure/database/postgres/interface/timeseries.repository.interface";
import {TimeSeriesEntity} from "../../timeseries/timeseries.entity";
import {AnyDayVariable} from "app";

export class MetricsSchedulerService extends BaseScheduler {
  private readonly taskEntity: TaskEntity;
  private readonly taskService: TaskService;
  private readonly repository: ITimeSeriesServiceRepository;

  constructor(entity: TaskEntity) {
    super(entity.config.scheduler);

    this.taskEntity = entity;
    this.taskService = Service.getService<TaskService>(TASK_SERVICE);
    this.repository = Service.getRepository(TIMESERIES_REPOSITORY);
  }

  private extract(metric: string, metrics: AnyDayVariable) {
    return getValue(metrics);

    function getValue(obj: AnyDayVariable): AnyDayVariable {
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
    this.taskService
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
