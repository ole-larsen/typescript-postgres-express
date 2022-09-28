import { IsEmail, IsString, MinLength } from "class-validator";
import { Trim } from "class-sanitizer";

export class AccountCreateDto {
  @IsString()
  @Trim()
  @MinLength(4, { message: "name should be minimum of 4 characters" })
  public name?: string;

  @IsEmail({}, { message: "email is not valid" })
  @Trim()
  public email?: string;

  public status?: string;

  public enabled?: boolean;
}