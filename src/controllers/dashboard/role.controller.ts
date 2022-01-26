"use strict";
import express, { Response, Request } from "express";
import {
    BAD_REQUEST_CODE,
    BaseController,
    CRUDControllerInterface,
    OK_REQUEST_CODE,
    UNAUTHORIZED_REQUEST_CODE
} from "../base.controller";
import {RoleRepository} from "../../infrastructure/storage/postgres/repository/role.repository";
import {EMITTER_SERVICE, ROLE_REPOSITORY_SERVICE, USER_REPOSITORY_SERVICE} from "../../services/constants";
import {Service} from "../../services/app.service";
import {RoleEntity} from "../../infrastructure/entities/roles.entity";
import EventEmitter from "events";
import {IRoleServiceRepository} from "../../infrastructure/interfaces/role.interface";
import {PublicUser, UserEntity} from "../../infrastructure/entities/users.entity";
import {AuthController} from "../auth/auth.controller";
import {
    ERROR_AUTH_EMAIL,
    ERROR_AUTH_EMPTY_PASSWORD_CREDENTIALS,
    ERROR_AUTH_PASSWORD_NOT_MATCH_CREDENTIALS, ERROR_AUTH_USERNAME
} from "../auth/auth.error.codes";
import {UserRepository} from "../../infrastructure/storage/postgres/repository/user.repository";
import logger from "../../util/logger";
const ERROR_ROLE_EMPTY_TITLE = "empty title";
const ERROR_ROLE_EMPTY_DESCRIPTION = "empty description";

export class RoleController extends BaseController implements CRUDControllerInterface {
    repository: IRoleServiceRepository
    emitter:    EventEmitter
    constructor() {
        super();
        this.repository = Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE);
        this.emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
        this.get = this.get.bind(this);
        this.getOne = this.getOne.bind(this);
        this.update = this.update.bind(this);
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);

        this.emitter.on("role", (message) => {
            switch (message.code) {
                case OK_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.role) {
                            logger.info(`role.${message.method}:${message.code} ${message.response.role.title}`);
                        } else if (message.response.roles) {
                            logger.info(`role.${message.method}:${message.code} loaded ${message.response.roles.length} roles`);
                        } else {
                            logger.info(`role.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.info(`role.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case UNAUTHORIZED_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`role.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`role.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`role.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case BAD_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`role.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`role.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`role.${message.method}:${message.code} ${message}`);
                    }
                    break;
                default:
                    console.log(message.code, message.method);
                    break;
            }
        });
    }

    /**
     * get all roles
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        // use with parameters
        const {id, title, enabled} = req.query;
        if (id) {
            try {
                if (Number.isFinite(Number(id))) {
                    this.repository.getRoleById(Number(id as string))
                        .then((role: RoleEntity) => {
                            this.emitter.emit("role", {
                                method: "get",
                                response: {role: role},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json(role);
                        })
                        .catch(e => {
                            this.emitter.emit("role", {
                                method: "get",
                                response: e,
                                code: BAD_REQUEST_CODE
                            });
                            return res.status(BAD_REQUEST_CODE).json({message: e.message});
                        });
                } else {
                    this.emitter.emit("role", {
                        method: "get",
                        response: {role: null},
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json([]);
                }
            } catch (e) {
                this.emitter.emit("role", {
                    method: "get",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            }
        }
        if (title) {
            try {
                this.repository.getRoleByTitle(title as string)
                    .then((role: RoleEntity) => {
                        this.emitter.emit("role", {
                            method: "get",
                            response: {role: role},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json(role);
                    })
                    .catch(e => {
                        this.emitter.emit("role", {
                            method: "get",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});

                    });
            } catch (e) {
                this.emitter.emit("role", {
                    method: "get",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            }
        }
        if (enabled) {
            try {
                this.repository.getRolesByEnabled(enabled as string === "true")
                    .then((roles: RoleEntity[]) => {
                        this.emitter.emit("role", {
                            method: "get",
                            response: {roles: roles},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json(roles);
                    })
                    .catch(e => {
                        this.emitter.emit("role", {
                            method: "get",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    });
            } catch (e) {
                this.emitter.emit("role", {
                    method: "get",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            }
        }
        this.repository.getRoles()
            .then((roles: RoleEntity[]) => {
                this.emitter.emit("role", {
                    method: "get",
                    response: {roles: roles.filter((role: RoleEntity) => role.removed === null || role.removed === undefined)},
                    code: OK_REQUEST_CODE
                });
                return res.status(OK_REQUEST_CODE).json(roles.filter((role: RoleEntity) => role.removed === null || role.removed === undefined));
            })
            .catch(e => {
                this.emitter.emit("role", {
                    method: "get",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    public getOne (req: express.Request, res: express.Response): express.Response {
        try {
            const id = Number(req.params.id);
            if (!id || !Number.isFinite(id)) {
                this.emitter.emit("role", {
                    method: "getOne",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getRoleById(id)
                .then((role: RoleEntity) => {
                    if (role) {
                        this.emitter.emit("role", {
                            method: "getOne",
                            response: {role: role},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json({role: role});
                    }
                })
                .catch(e => {
                    this.emitter.emit("role", {
                        method: "getOne",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("role", {
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
                this.emitter.emit("role", {
                    method: "update",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getRoleById(req.body.id)
                .then((role: RoleEntity) => {
                    if (role) {
                        // change role status
                        if (req.body.title) {
                            role.title = req.body.title;
                        }
                        if (req.body.description) {
                            role.description = req.body.description;
                        }
                        if (role.enabled !== req.body.enabled) {
                            role.enabled = req.body.enabled;
                        }
                        if (req.body.users) {
                            role.users = req.body.users;
                        }
                        role.save()
                        .then((r: RoleEntity) => {
                            this.emitter.emit("role", {
                                method: "update",
                                response: {role: r},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json({role: r});
                        })
                        .catch((e: Error) => {
                            this.emitter.emit("role", {
                                method: "update",
                                response: e,
                                code: BAD_REQUEST_CODE
                            });
                            return res.status(BAD_REQUEST_CODE).json({message: e.message});
                        });
                    }
                })
                .catch(e => {
                    this.emitter.emit("role", {
                        method: "update",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("role", {
                method: "update",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public create (req: express.Request, res: express.Response): express.Response {
        try {
            const credentials = req.body;
            if (credentials.title === "") {
                this.emitter.emit("role", {
                    method: "create",
                    response: new Error(ERROR_ROLE_EMPTY_TITLE),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: ERROR_ROLE_EMPTY_TITLE});
            }
            if (credentials.description === "") {
                this.emitter.emit("role", {
                    method: "create",
                    response: new Error(ERROR_ROLE_EMPTY_DESCRIPTION),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: ERROR_ROLE_EMPTY_DESCRIPTION});
            }
            if (credentials.title !== "") {
                (async () => {
                    try {
                        const role = await this.repository.getRoleByTitle(credentials.title);
                        if (role) {
                            if (role.removed !== null) {
                                role.removed = undefined;
                                role.enabled = true;
                                this.emitter.emit("role", {
                                    method: "create",
                                    response: {role: role},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json({role: await role.save()});
                            } else {
                                this.emitter.emit("role", {
                                    method: "create",
                                    response: new Error("role exists"),
                                    code: BAD_REQUEST_CODE
                                });
                                return res.status(BAD_REQUEST_CODE).json({message: "role exists"});
                            }
                        }

                        this.repository
                            .create(new RoleEntity(
                                null,
                                credentials.title,
                                credentials.description,
                                credentials.enabled
                            ))
                            .then((role: RoleEntity) => {
                                this.emitter.emit("role", {
                                    method: "create",
                                    response: {role: role},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json({role: role});
                            })
                            .catch(e => {
                                this.emitter.emit("role", {
                                    method: "create",
                                    response: e,
                                    code: BAD_REQUEST_CODE
                                });
                                return res.status(BAD_REQUEST_CODE).json({message: e.message});
                            });
                    } catch (e) {
                        this.emitter.emit("role", {
                            method: "create",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    }
                })();
            }
        } catch (e) {
            this.emitter.emit("role", {
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
                this.emitter.emit("role", {
                    method: "delete",
                    response: new Error("invalid parameters"),
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
            }
            this.repository.getRoleById(req.body.id)
                .then(async (role: RoleEntity) => {
                    if (role) {
                        try {
                            const removedRole = await role.remove();
                            this.emitter.emit("role", {
                                method: "create",
                                response: {role: removedRole},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json({role: removedRole});
                        } catch (e) {
                            throw e;
                        }
                    } else {
                        throw new Error("no role");
                    }
                })
                .catch(e => {
                    this.emitter.emit("role", {
                        method: "delete",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        } catch (e) {
            this.emitter.emit("role", {
                method: "delete",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }
}