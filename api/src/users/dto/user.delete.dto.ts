import { IsNumber } from "class-validator";

export class UserDeleteDto {
  @IsNumber()
  public id?: number;
}