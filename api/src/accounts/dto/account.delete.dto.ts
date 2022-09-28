import { IsNumber } from "class-validator";

export class AccountDeleteDto {
  @IsNumber()
  public id?: number;
}