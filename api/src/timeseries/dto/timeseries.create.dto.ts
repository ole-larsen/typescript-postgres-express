import { IsEmail, IsString, MinLength } from "class-validator";
import { Trim } from "class-sanitizer";

export class TimeSeriesCreateDto {

  @IsString()
  @Trim()
  @MinLength(5, { message: "username should be minimum of 5 characters" })
  public username?: string;

  @IsEmail({}, { message: "email is not valid" })
  @Trim()
  public email?: string;

  @IsString()
  @MinLength(5, { message: "password should be minimum of 5 characters" })
  public password?: string;

  @IsString()
  @MinLength(5, { message: "password repeat should be minimum of 5 characters" })
  public confirm?: string;

}