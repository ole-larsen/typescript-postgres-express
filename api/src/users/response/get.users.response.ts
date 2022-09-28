import {PublicUser} from "../user.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetUsersResponse extends BaseResponse{
  data: PublicUser[]

  constructor(users: PublicUser[]) {
    super();
    this.data = users;
  }
}