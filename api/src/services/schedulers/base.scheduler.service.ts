import cron, { ScheduledTask } from "node-cron";
import {Service} from "../app.service";
import {LOGGER_SERVICE} from "../app.constants";
import {Logger} from "../../infrastructure/util/logger";

/**
 * Scheduler Base Class.
 */
export abstract class BaseScheduler {
  private readonly task: ScheduledTask;
  protected readonly logger: Logger;

  /**
   * Create scheduler and start.
   *
   * @param cronExpression
   */
  protected constructor(cronExpression: string) {
    this.task = cron.schedule(cronExpression, this.work.bind(this));
    this.logger = Service.getService<Logger>(LOGGER_SERVICE);
  }

  /**
   * Some job.
   *
   * @protected
   */
  protected abstract work(): void;
}
