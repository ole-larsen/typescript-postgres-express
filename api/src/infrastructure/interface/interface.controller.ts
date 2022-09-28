import express from "express";

export interface IAuthController {
  get(req: express.Request, res: express.Response): Promise<express.Response>

  check(req: express.Request, res: express.Response): express.Response

  login(req: express.Request, res: express.Response): Promise<express.Response>

  ga2fa(req: express.Request, res: express.Response): express.Response

  signup(req: express.Request, res: express.Response): Promise<express.Response>

  callback(req: express.Request, res: express.Response): express.Response

  logout(req: express.Request, res: express.Response): Promise<express.Response>

  forgot(req: express.Request, res: express.Response): express.Response

  reset(req: express.Request, res: express.Response): express.Response
}

export interface ICRUDController {
  get(req: express.Request, res: express.Response): Promise<express.Response>

  getOne(req: express.Request, res: express.Response): Promise<express.Response>

  update(req: express.Request, res: express.Response): Promise<express.Response>

  create(req: express.Request, res: express.Response): Promise<express.Response>

  delete(req: express.Request, res: express.Response): Promise<express.Response>
}