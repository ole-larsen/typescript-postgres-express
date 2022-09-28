import {TaskEntity} from "../task.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetTaskResponse extends BaseResponse {
  data: TaskEntity;

  constructor(entity: TaskEntity) {
    super();
    this.data = entity;
  }
}