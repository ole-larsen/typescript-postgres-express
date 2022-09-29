import {TaskEntity} from "../../../tasks/task.entity";

export interface ITaskClient {
    getTasks(): Promise<TaskEntity[]>;
}