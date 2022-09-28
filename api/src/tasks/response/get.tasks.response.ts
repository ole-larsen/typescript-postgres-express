import {TaskEntity} from "../task.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetTasksResponse extends BaseResponse{
  data: TaskEntity[];

  constructor(entities: TaskEntity[]) {
    super();
    this.data = entities;
  }
}