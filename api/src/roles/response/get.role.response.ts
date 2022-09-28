import {RoleEntity} from "../role.entity";
import {BaseResponse} from "../../infrastructure/response/base.response";

export class GetRoleResponse extends BaseResponse {
  data: RoleEntity
  constructor(entity: RoleEntity) {
    super();
    this.data = entity;
  }
}