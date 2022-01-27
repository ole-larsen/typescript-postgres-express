"use strict";
import express from "express";
import {BaseController} from "./base.controller";

export class ApiController extends BaseController {

    /**
     * get /api
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        return res.send({ ping: "pong" });
    }
}
