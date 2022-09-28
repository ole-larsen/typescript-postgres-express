import { IsString, MinLength } from "class-validator";
import { Trim } from "class-sanitizer";

export class RoleCreateDto {
  @IsString()
  @Trim()
  @MinLength(5, { message: "title should be minimum of 5 characters" })
  public title?: string;

  public description?: string;

  public config?: unknown;

  public users?: number[];
}