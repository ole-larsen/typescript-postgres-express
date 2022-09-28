import {PublicUser} from "../user.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class UpdateUserResponse extends BaseResponse{
  data: PublicUser

  constructor(user: PublicUser) {
    super();
    this.data = user;
  }
}