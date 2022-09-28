import {IsArray, IsBoolean, IsEmail, IsString, MinLength} from "class-validator";
import { Trim } from "class-sanitizer";

export class UserUpdateDto {

  @IsString()
  @Trim()
  @MinLength(3, { message: "username should be minimum of 3 characters" })
  public username?: string;

  @IsEmail({}, { message: "email is not valid" })
  @Trim()
  public email?: string;

  public gravatar?: string;

  public secret?: string;

  public enabled?: boolean;

  public roles?: number[]

  public accounts?: number[]

}