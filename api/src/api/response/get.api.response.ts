import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetApiResponse extends BaseResponse{
  ping: string;
  constructor() {
    super();
    this.ping = "pong";
  }
}