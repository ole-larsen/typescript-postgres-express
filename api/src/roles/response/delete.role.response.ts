import {BaseResponse} from "../../infrastructure/response/base.response";

export class DeleteRoleResponse extends BaseResponse{
  data: {
    id: number;
  }
  constructor(id: number) {
    super();
    this.data = { id };
  }
}