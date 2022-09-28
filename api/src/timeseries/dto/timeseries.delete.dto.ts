import { IsNumber } from "class-validator";

export class TimeSeriesDeleteDto {
  @IsNumber()
  public id?: number;
}