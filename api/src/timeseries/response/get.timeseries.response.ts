import {BaseResponse} from "../../infrastructure/response/base.response";
import {TimeSeriesEntity} from "../timeseries.entity";

export class GetTimeSeriesResponse extends BaseResponse {
  data: TimeSeriesEntity[]
  constructor(entities: TimeSeriesEntity[]) {
    super();
    this.data = entities;
  }
}