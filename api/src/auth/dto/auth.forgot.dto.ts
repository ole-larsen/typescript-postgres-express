import { IsEmail } from "class-validator";
import { Trim } from "class-sanitizer";

export class AuthForgotDto {

  public username?: string;

  @IsEmail({}, { message: "email is not valid" })
  @Trim()
  public email?: string;
}