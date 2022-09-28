import { IsNumber } from "class-validator";

export class RoleDeleteDto {
  @IsNumber()
  public id?: number;
}