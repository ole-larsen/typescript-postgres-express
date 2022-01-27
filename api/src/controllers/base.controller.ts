import express from "express";
import logger from "../util/logger";

export abstract class BaseController {
    // This needs to be implemented
    abstract get    (req: express.Request, res: express.Response): express.Response;

    compileLogger (message: any, entity: string, entities: string): void {
        switch (message.code) {
            case OK_REQUEST_CODE:
                if (message.response) {
                    if (message.response[entity]) {
                        logger.info(`${entity}.${message.method}:${message.code} ${message.response[entity].name}`);
                    } else if (message.response[entities]) {
                        logger.info(`${entity}.${message.method}:${message.code} loaded ${message.response[entities].length} ${entities}`);
                    } else {
                        logger.info(`${entity}.${message.method}:${message.code} ${message.response}`);
                    }
                } else {
                    logger.info(`${entity}.${message.method}:${message.code} ${message}`);
                }
                break;
            case UNAUTHORIZED_REQUEST_CODE:
                if (message.response) {
                    if (message.response.message) {
                        logger.error(`${entity}.${message.method}:${message.code} ${message.response.message}`);
                    } else {
                        logger.error(`${entity}.${message.method}:${message.code} ${message.response}`);
                    }
                } else {
                    logger.error(`${entity}.${message.method}:${message.code} ${message}`);
                }
                break;
            case BAD_REQUEST_CODE:
                if (message.response) {
                    if (message.response.message) {
                        logger.error(`${entity}.${message.method}:${message.code} ${message.response.message} ${message.response.stack}`);
                    } else {
                        logger.error(`${entity}.${message.method}:${message.code} ${message.response}`);
                    }
                } else {
                    logger.error(`${entity}.${message.method}:${message.code} ${message}`);
                }
                break;
            default:
                console.log(message.code, message.method);
                break;
        }
    }
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

export interface IAuthController {
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
    login    (req: express.Request, res: express.Response): express.Response

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
    logout   (req: express.Request, res: express.Response): express.Response

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

export interface ICRUDController {
    get      (req: express.Request, res: express.Response): express.Response
    getOne   (req: express.Request, res: express.Response): express.Response
    update   (req: express.Request, res: express.Response): express.Response
    create   (req: express.Request, res: express.Response): express.Response
    delete   (req: express.Request, res: express.Response): express.Response
}


