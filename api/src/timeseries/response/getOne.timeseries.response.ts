import {BaseResponse} from "../../infrastructure/response/base.response";
import {TimeSeriesEntity} from "../timeseries.entity";

export class GetOneTimeSeriesResponse extends BaseResponse {
  data: TimeSeriesEntity

  constructor(entity: TimeSeriesEntity) {
    super();
    this.data = entity;
  }
}