import {BaseResponse} from "../../infrastructure/response/base.response";
import {AccountEntity} from "../account.entity";

export class GetAccountResponse extends BaseResponse {
  data: AccountEntity;

  constructor(entity: AccountEntity) {
    super();
    this.data = entity;
  }
}