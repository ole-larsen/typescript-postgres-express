import { IsEmail, IsString, MinLength } from "class-validator";
import { Trim } from "class-sanitizer";

export class AuthLoginDto {

  public username?: string;

  @IsEmail({}, { message: "email is not valid" })
  @Trim()
  public email?: string;

  @IsString()
  @MinLength(5, { message: "password should be minimum of 5 characters" })
  public password?: string;
}