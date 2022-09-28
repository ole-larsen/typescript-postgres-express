import {AccountEntity} from "../account.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetAccountsResponse extends BaseResponse {
  data: AccountEntity[];

  constructor(entities: AccountEntity[]) {
    super();
    this.data = entities;
  }
}