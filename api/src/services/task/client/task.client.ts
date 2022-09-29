import {Service} from "../../app.service";
import {TASK_REPOSITORY} from "../../app.constants";
import {ITaskClient} from "../interfaces/task.client.interface";
import {ITaskServiceRepository} from "../../../infrastructure/database/postgres/interface/task.repository.interface";
import {TaskEntity} from "../../../tasks/task.entity";

export class TaskClient implements ITaskClient {
  getTasks(): Promise<TaskEntity[]> {
    return Service.getRepository<ITaskServiceRepository>(TASK_REPOSITORY).get();
  }
}
