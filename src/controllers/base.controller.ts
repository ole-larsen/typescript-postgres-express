import express from "express";

export interface SessionRequest extends express.Request {
    session: any
}

export abstract class BaseController {
    // This needs to be implemented
    abstract get    (req: express.Request, res: express.Response): express.Response;
}

// const
export const OK_REQUEST_CODE = 200;
export const POST_CREATE_OK_REQUEST_CODE = 201;
export const BAD_REQUEST_CODE = 400;
export const UNAUTHORIZED_REQUEST_CODE = 401;
export const FORBIDDEN_REQUEST_CODE = 403;
export const METHOD_NOT_ALLOWED_REQUEST_CODE = 405;
export const SERVER_ERROR_REQUEST_CODE = 500;
export const NOT_IMPLEMENTED_REQUEST_CODE = 501;

export interface AuthControllerInterface {
    get      (req: express.Request, res: express.Response): express.Response

    /**
     * check oauth token
     * @param req
     * @param res
     */
    check    (req: express.Request, res: express.Response): express.Response

    /**
     * login using username or email
     * @param req
     * @param res
     */
    login    (req: SessionRequest, res: express.Response): express.Response

    /**
     * 2-FA route
     * @param req
     * @param res
     */
    ga2fa    (req: express.Request, res: express.Response): express.Response

    /**
     * registration
     * @param req
     * @param res
     */
    signup   (req: express.Request, res: express.Response): express.Response

    /**
     * callback for oauth2 server
     * @param req
     * @param res
     */
    callback (req: express.Request, res: express.Response): express.Response

    /**
     * logout
     * @param req
     * @param res
     */
    logout   (req: SessionRequest, res: express.Response): express.Response

    /**
     * generate password restore token
     * @param req
     * @param res
     */
    forgot (req: express.Request, res: express.Response): express.Response

    /**
     * change password
     * @param req
     * @param res
     */
    reset (req: express.Request, res: express.Response): express.Response
}

export interface CRUDControllerInterface {
    get      (req: express.Request, res: express.Response): express.Response
    getOne   (req: express.Request, res: express.Response): express.Response
    update   (req: express.Request, res: express.Response): express.Response
    create   (req: express.Request, res: express.Response): express.Response
    delete   (req: express.Request, res: express.Response): express.Response
}


