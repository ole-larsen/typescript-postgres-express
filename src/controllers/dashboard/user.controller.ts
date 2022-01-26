"use strict";
import express from "express";
import {
    AuthControllerInterface, BAD_REQUEST_CODE,
    BaseController,
    CRUDControllerInterface,
    OK_REQUEST_CODE,
    UNAUTHORIZED_REQUEST_CODE
} from "../base.controller";
import EventEmitter from "events";
import {Service} from "../../services/app.service";
import {CONFIG_SERVICE, EMITTER_SERVICE, USER_REPOSITORY_SERVICE} from "../../services/constants";
import {UserRepository} from "../../infrastructure/storage/postgres/repository/user.repository";
import {PublicUser, UserEntity} from "../../infrastructure/entities/users.entity";
import {Config} from "../../util/secrets";
import {IUserServiceRepository} from "../../infrastructure/interfaces/user.interface";
import {AuthController} from "../auth/auth.controller";
import logger from "../../util/logger";

export class UserController extends BaseController implements CRUDControllerInterface {
    repository: IUserServiceRepository
    emitter:    EventEmitter
    config:     Config
    constructor() {
        super();
        this.repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        this.emitter    = Service.getService<EventEmitter>(EMITTER_SERVICE);
        this.config     = Service.getService<Config>(CONFIG_SERVICE);
        this.get = this.get.bind(this);
        this.getOne = this.getOne.bind(this);
        this.update = this.update.bind(this);
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);

        this.emitter.on("user", (message) => {
            switch (message.code) {
                case OK_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.user) {
                            logger.info(`user.${message.method}:${message.code} ${message.response.user.id} ${message.response.user.username}`);
                        } else if (message.response.users) {
                            logger.info(`user.${message.method}:${message.code} loaded ${message.response.users.length} users`);
                        } else {
                            logger.info(`user.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.info(`user.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case UNAUTHORIZED_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`user.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`user.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`user.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case BAD_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`user.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`user.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`user.${message.method}:${message.code} ${message}`);
                    }
                    break;
                default:
                    console.log(message.code, message.method);
                    break;
            }
        });
    }

    /**
     * create root user
     * @private
     */
    private createFirstUser(): Promise<UserEntity> {
        const user: UserEntity = new UserEntity(
            undefined,
            this.config.defaultUser.username,
            this.config.defaultUser.email,
            this.config.defaultUser.password,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined
        );
        return this.repository.create(user, true);
    }

    /**
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        try {
            this.repository.getUsers()
                .then((users: UserEntity[]) => {
                    if (users.length === 0) {
                        this.emitter.emit("config", `${users.length} users found. creating ${this.config.defaultUser.username}`);
                        this.createFirstUser()
                            .then((user: UserEntity) => {
                                this.emitter.emit("user", {
                                    method: "get",
                                    response: {user: user},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json([user]);
                            })
                            .catch(e => {
                                this.emitter.emit("user", {
                                    method: "get",
                                    response: e,
                                    code: BAD_REQUEST_CODE
                                });
                                return res.status(BAD_REQUEST_CODE).json({message: e.message});
                            });
                    } else {
                        this.emitter.emit("user", {
                            method: "get",
                            response: {users: users.filter((user: UserEntity) => user.removed === null || user.removed === undefined)},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json(users.filter((user: UserEntity) => user.removed === null || user.removed === undefined));
                    }
                })
                .catch(e => {
                    this.emitter.emit("user", {
                        method: "get",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("user", {
                method: "get",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public getOne (req: express.Request, res: express.Response): express.Response {
        try {
            const id = Number(req.params.id);
            if (!id || !Number.isFinite(id)) {
                this.emitter.emit("user", {
                    method: "getOne",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getUserById(id)
                .then((user: UserEntity) => {
                    if (user) {
                        this.emitter.emit("user", {
                            method: "getOne",
                            response: {user: user},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json({user: user});
                    }
                })
                .catch(e => {
                    this.emitter.emit("user", {
                        method: "getOne",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("user", {
                method: "getOne",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public update (req: express.Request, res: express.Response): express.Response {
        try {
            if (!req.body.id) {
                this.emitter.emit("user", {
                    method: "update",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getUserById(req.body.id)
                .then((user: UserEntity) => {
                    if (user) {
                        // change user status
                        if (req.body.email !== "") {
                            user.email = req.body.email;
                        }
                        if (req.body.username !== "") {
                            user.username = req.body.username;
                        }
                        if (user.enabled !== req.body.enabled) {
                            this.emitter.emit("user", `change ${user.username} enabled/disabled`);
                            user.enabled = req.body.enabled;
                        }
                        if (req.body.secret === "") {
                            user.secret = req.body.secret;
                            this.emitter.emit("user", `reset ${user.username} 2FA`);
                        }
                        if (req.body.roles) {
                            user.roles = req.body.roles;
                        }
                        user.save()
                        .then((u: UserEntity) => {
                            const publicUser: PublicUser = {
                                id: u.id,
                                username: u.username,
                                gravatar: u.gravatar,
                                email: u.email,
                                enabled: u.enabled,
                                removed: !!u.removed,
                                expired: null,
                                token: null,
                                roles: u.roles
                            };
                            this.emitter.emit("user", {
                                method: "update",
                                response: {user: publicUser},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json({user: publicUser});
                        }).catch((e: Error) => {
                            this.emitter.emit("user", {
                                method: "update",
                                response: e,
                                code: BAD_REQUEST_CODE
                            });
                            return res.status(BAD_REQUEST_CODE).json({message: e.message});
                        });
                    }
                })
                .catch(e => {
                    this.emitter.emit("user", {
                        method: "update",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("user", {
                method: "update",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public create (req: express.Request, res: express.Response): express.Response {
        try {
            const authController = new AuthController();
            authController.signup(req, res);
        } catch (e) {
            this.emitter.emit("user", {
                method: "create",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public delete (req: express.Request, res: express.Response): express.Response {
        try {
            if (!req.body.id) {
                this.emitter.emit("user", {
                    method: "delete",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getUserById(req.body.id)
                .then(async (user: UserEntity) => {
                    if (user) {
                        try {
                            const removedUser = await user.remove();
                            const publicUser: PublicUser = {
                                id: removedUser.id,
                                username: removedUser.username,
                                gravatar: removedUser.gravatar,
                                email: removedUser.email,
                                enabled: removedUser.enabled,
                                removed: !!removedUser.removed,
                                expired: null,
                                token: null,
                                roles: removedUser.roles
                            };
                            this.emitter.emit("user", {
                                method: "delete",
                                response: {user: publicUser},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json({user: publicUser});
                        } catch (e) {
                            throw e;
                        }
                    } else {
                        throw new Error("no user");
                    }
                })
                .catch(e => {
                    this.emitter.emit("user", {
                        method: "delete",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("user", {
                method: "delete",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }
}