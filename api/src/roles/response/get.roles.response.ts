import {RoleEntity} from "../role.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetRolesResponse extends BaseResponse{
  data: RoleEntity[]
  constructor(entities: RoleEntity[]) {
    super();
    this.data = entities;
  }
}