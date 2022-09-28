import express from "express";
import {Service} from "../services/app.service";


import {
  BaseController,
} from "../base.controller";

import {
  TIMESERIES_REPOSITORY
} from "../services/app.constants";
import {HttpStatus} from "../infrastructure/exception/auth.exception.messages";

import {HttpException} from "../infrastructure/exception/http.exception";
import {ITimeSeriesServiceRepository} from "../infrastructure/database/postgres/interface/timeseries.repository.interface";
import {TimeSeriesMetric} from "./timeseriesMetrics.entity";

export class TimeSeriesController extends BaseController {
  entity: string;
  repository: ITimeSeriesServiceRepository;

  constructor() {
    super();

    this.repository = Service.getRepository<ITimeSeriesServiceRepository>(TIMESERIES_REPOSITORY);
    this.entity = "timeSeriesController";

    this.get = this.get.bind(this);

    this.emitter.on(this.entity, (message) => {
      this.compileLogger(this.entity, message);
    });
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("TimeSeriesHttpException", code, message);
  }

  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.repository
      .getMetrics()
      .then((entities: TimeSeriesMetric[]) => {
        return res.status(HttpStatus.OK).json(entities);
      })
      .catch((e: Error) => {
        if (e instanceof HttpException) {
          return res.status(HttpStatus.BAD_REQUEST).json({message: e.message});
        }
        throw e;
      });
  }
}