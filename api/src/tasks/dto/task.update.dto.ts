import {IsBoolean, IsEmail, IsString, MinLength} from "class-validator";
import { Trim } from "class-sanitizer";

export class TaskUpdateDto {

  @IsString()
  @Trim()
  @MinLength(5, { message: "username should be minimum of 5 characters" })
  public name?: string;

  @IsString()
  @Trim()
  @MinLength(3, { message: "identity should be minimum of e characters" })
  public identity?: string;

  public config?: {
    query: string;
    metrics: string;
    scheduler: string;
  };

  public status?: string;

  public enabled?: boolean;
}