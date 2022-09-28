import { BaseScheduler } from "./base.scheduler.service";
import {Service} from "../app.service";
import {Config} from "../../infrastructure/util/secrets";
import {
    CONFIG_SERVICE,
    SCHEDULER_SERVICE
} from "../app.constants";
import {HttpService} from "../http/http.service";
import {TaskEntity} from "../../tasks/task.entity";
import {MetricsSchedulerService} from "./metrics.scheduler.service";

export class TaskService extends BaseScheduler {
    private readonly httpService: HttpService;

    constructor(cronExpression: string = Service.getService<Config>(CONFIG_SERVICE).schedulers.httpScheduler || "*/1 * * * *") {
        super(cronExpression);
        this.httpService = Service.getService<HttpService>(SCHEDULER_SERVICE);
    }

    public work(): void {
        this.logger.info("start every minute main scheduler", { service: "main-scheduler" });
        this.httpService
          .getTasks()
          .then((tasks: TaskEntity[]) => {
              tasks.forEach((task: TaskEntity) => {
                if (task.enabled) {
                  if (!Service.getScheduler<MetricsSchedulerService>(task.name, task.identity)) {
                    const scheduler = new MetricsSchedulerService(task);
                    Service.addScheduler(task.name, task.identity, scheduler);
                  }
                }
                if (!task.enabled) {
                  if (Service.getScheduler<MetricsSchedulerService>(task.name, task.identity)) {
                    Service.deleteScheduler(task.name, task.identity);
                  }
                }
              });
          })
          .catch((e: Error) => {
              this.logger.debug(e.message, { service: "scheduler" });
          });
    }
}
