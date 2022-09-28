import {PublicUser} from "../user.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class PostForgotResponse extends BaseResponse{
  data: {
    token: string,
    user: PublicUser;
  }

  constructor(token: string, user: PublicUser) {
    super();
    this.data = {
      token,
      user
    };
  }
}