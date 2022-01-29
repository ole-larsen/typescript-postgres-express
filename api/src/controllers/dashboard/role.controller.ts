"use strict";
import express from "express";
import {
    BAD_REQUEST_CODE,
    BaseController,
    ICRUDController,
    OK_REQUEST_CODE
} from "../base.controller";
import {RoleRepository} from "../../db/storage/postgres/repository/role.repository";
import {EMITTER_SERVICE, ROLE_REPOSITORY_SERVICE} from "../../services/constants";
import {Service} from "../../services/app.service";
import {RoleEntity} from "../../db/entities/roles.entity";
import EventEmitter from "events";
import {IRoleServiceRepository} from "../../db/interfaces/role.interface";

const ERROR_ROLE_EMPTY_TITLE = "empty title";
const ERROR_ROLE_EMPTY_DESCRIPTION = "empty description";

export class RoleController extends BaseController implements ICRUDController {
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
            this.compileLogger(message, "role", "roles");
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
                        // catch repository getRole Error
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
        }
        if (title) {
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
                    // catch repository getRole Error
                    this.emitter.emit("role", {
                        method: "get",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        }
        if (enabled) {
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
                    // catch repository getRole Error
                    this.emitter.emit("role", {
                        method: "get",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
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

    /**
     * getOne function to get one role for update /api/v1/role/:id
     * @param req
     * @param res
     */
    public getOne (req: express.Request, res: express.Response): express.Response {
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
                // catch repository getRole Error
                this.emitter.emit("role", {
                    method: "getOne",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    /**
     * put /api/v1/role
     * update roles
     * @param req
     * @param res
     */
    public update (req: express.Request, res: express.Response): express.Response {
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
                            // catch error while saving from role repository update
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
                // catch repository getRole Error
                this.emitter.emit("role", {
                    method: "update",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    /**
     * POST /api/v1/roles
     * @param req
     * @param res
     */
    public create (req: express.Request, res: express.Response): express.Response {
        try {
            const credentials = req.body;
            if (credentials.title === "") {
                throw new Error(ERROR_ROLE_EMPTY_TITLE);
            }
            if (credentials.description === "") {
                throw new Error(ERROR_ROLE_EMPTY_DESCRIPTION);
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
                                throw new Error("role exists");
                            }
                        }
                    } catch (e) {
                        this.emitter.emit("role", {
                            method: "create",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    }
                })();
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
        if (!req.body.id) {
            this.emitter.emit("role", {
                method: "delete",
                response: new Error("invalid parameters"),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
        }
        this.repository.getRoleById(req.body.id)
            .then((role: RoleEntity) => {
                if (role) {
                    role.remove()
                    .then((removedRole: RoleEntity) => {
                        this.emitter.emit("role", {
                            method: "create",
                            response: {role: removedRole},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json({role: removedRole});
                    })
                    .catch(e => {
                        this.emitter.emit("role", {
                            method: "delete",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    });
                } else {
                    this.emitter.emit("role", {
                        method: "delete",
                        response: new Error("no roles found"),
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: "no roles found"});
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
    }
}