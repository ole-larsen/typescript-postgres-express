import express from "express";
import {BaseController} from "../base.controller";
import {GetApiResponse} from "./response/get.api.response";

export class ApiController extends BaseController {
  public get(req: express.Request, res: express.Response): Promise<express.Response> {
    return new Promise((resolve) => resolve(res.json(new GetApiResponse())));
  }
}
