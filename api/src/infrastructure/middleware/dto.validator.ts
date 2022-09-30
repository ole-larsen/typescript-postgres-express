import express, { RequestHandler } from "express";
import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { sanitize } from "class-sanitizer";
import { HttpException } from "../exception/http.exception";
import {HttpStatus} from "../exception/auth.exception.messages";
import {AnyDayVariable} from "app";

function dtoValidatorMiddleware(type: AnyDayVariable, skipMissingProperties = false): RequestHandler {

  return (request: express.Request, response: express.Response, next: express.NextFunction) => {
    const dtoObj = plainToClass(type, request.body);
    validate(dtoObj, { skipMissingProperties }).then(
      (errors: ValidationError[]) => {
        if (errors.length > 0) {
          const dtoErrors = errors.map((error: ValidationError) =>
            Object.values(error.constraints)).join(", ");
          next(new HttpException(HttpStatus.BAD_REQUEST, dtoErrors));
        } else {
          //sanitize the object and call the next middleware
          sanitize(dtoObj);
          request.body = dtoObj;
          next();
        }
      }
    );
  };
}


export default dtoValidatorMiddleware;