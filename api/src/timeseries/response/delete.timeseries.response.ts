import {BaseResponse} from "../../infrastructure/response/base.response";

export class DeleteTimeSeriesResponse extends BaseResponse {
  data: {
    id: number;
  }
  constructor(id: number) {
    super();
    this.data = { id };
  }
}