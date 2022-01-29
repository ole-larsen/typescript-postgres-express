"use strict";
import express from "express";
import {
    BAD_REQUEST_CODE,
    BaseController,
    ICRUDController,
    OK_REQUEST_CODE
} from "../base.controller";
import EventEmitter from "events";
import {Service} from "../../services/app.service";
import {CONFIG_SERVICE, EMITTER_SERVICE, USER_REPOSITORY_SERVICE} from "../../services/constants";
import {UserRepository} from "../../db/storage/postgres/repository/user.repository";
import {PublicUser, UserEntity} from "../../db/entities/users.entity";
import {Config} from "../../util/secrets";
import {IUserServiceRepository} from "../../db/interfaces/user.interface";
import {AuthController} from "../auth/auth.controller";

export class UserController extends BaseController implements ICRUDController {
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
            this.compileLogger(message, "user", "users");
        });
    }

    /**
     * create root user
     * @private
     */
    private createFirstUser(): Promise<UserEntity> {
        return new Promise(async(resolve, reject) => {
           try {
                const root = await this.repository.create(new UserEntity(
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
               ), true);
               await Promise.all(["admin", "user", "user1", "user2", "user3", "user4", "user5", "manager", "manager1", "manager2", "manager3", "manager4", "manager5"].map(async(username) => {
                   await this.repository.create(new UserEntity(
                       undefined,
                       username,
                       username + "@example.com",
                       this.config.defaultUser.password,
                       true,
                       undefined,
                       undefined,
                       undefined,
                       undefined,
                       undefined,
                       undefined,
                       undefined
                   ), true);
               }));
               resolve(root);
           } catch (e) {
               reject(e);
           }
        });
    }

    /**
     * get /api/v1/user
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        // need this try catch to have correct express.Response in function return type. It should return something
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
    }

    /**
     * put /api/v1/user
     * @param req
     * @param res
     */
    public update (req: express.Request, res: express.Response): express.Response {
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
                        user.roles = [...new Set(req.body.roles)] as number[];
                    }
                    if (req.body.accounts) {
                        user.accounts = [...new Set(req.body.accounts)] as number[];
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
                                roles: u.roles,
                                accounts: u.accounts
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
    }

    /**
     * post /api/v1/user
     * @param req
     * @param res
     */
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

    /**
     * Delete /api/v1/user
     * @param req
     * @param res
     */
    public delete (req: express.Request, res: express.Response): express.Response {
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
                            roles: removedUser.roles,
                            accounts: removedUser.accounts
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
    }
}