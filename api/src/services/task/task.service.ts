import {Service} from "../app.service";
import {TASK_REPOSITORY, SCHEDULER_CLIENT} from "../app.constants";
import {ITaskClient} from "./interfaces/task.client.interface";
import {ITaskServiceRepository} from "../../infrastructure/database/postgres/interface/task.repository.interface";
import {TaskEntity} from "../../tasks/task.entity";
import {AnyDayVariable} from "app";

export class TaskService {
    private readonly client: ITaskClient;
    private readonly repository: ITaskServiceRepository;

    constructor() {
        this.client = Service.getClient<ITaskClient>(SCHEDULER_CLIENT);
        this.repository = Service.getRepository<ITaskServiceRepository>(TASK_REPOSITORY);
    }

    public getTasks(): Promise<TaskEntity[]> {
        return this.client.getTasks();
    }

    getMetrics(url: string): Promise<AnyDayVariable> {
        return Service.fetchJSON(url);
    }
}