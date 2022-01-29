"use strict";
import express from "express";
import {
    BAD_REQUEST_CODE,
    BaseController,
    ICRUDController,
    OK_REQUEST_CODE
} from "../base.controller";
import {
    ACCOUNT_REPOSITORY_SERVICE,
    EMITTER_SERVICE,
} from "../../services/constants";
import {Service} from "../../services/app.service";
import EventEmitter from "events";
import {IAccountServiceRepository} from "../../db/interfaces/account.interface";
import {AccountRepository} from "../../db/storage/postgres/repository/account.repository";
import {AccountEntity} from "../../db/entities/accounts.entity";
const ERROR_ACCOUNT_EMPTY_NAME = "empty name";
const ERROR_ACCOUNT_EMPTY_EMAIL = "empty email";

export class AccountController extends BaseController implements ICRUDController {
    repository: IAccountServiceRepository
    emitter:    EventEmitter
    constructor() {
        super();
        this.repository = Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE);
        this.emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
        this.get = this.get.bind(this);
        this.getOne = this.getOne.bind(this);
        this.update = this.update.bind(this);
        this.create = this.create.bind(this);
        this.delete = this.delete.bind(this);

        this.emitter.on("account", (message) => {
            this.compileLogger(message, "account", "accounts");
        });
    }
    /**
     * get all accounts
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        // use with parameters
        const {id, name, enabled} = req.query;
        if (id) {
            if (Number.isFinite(Number(id))) {
                this.repository.getAccountById(Number(id as string))
                    .then((account: AccountEntity) => {
                        this.emitter.emit("account", {
                            method: "get",
                            response: {account: account},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json(account);
                    })
                    .catch(e => {
                        this.emitter.emit("account", {
                            method: "get",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    });
            } else {
                this.emitter.emit("account", {
                    method: "get",
                    response: {account: null},
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json([]);
            }
        }
        if (name) {
            this.repository.getAccountByName(name as string)
                .then((account: AccountEntity) => {
                    this.emitter.emit("account", {
                        method: "get",
                        response: {account: account},
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json(account);
                })
                .catch(e => {
                    this.emitter.emit("account", {
                        method: "get",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        }
        if (enabled) {
            this.repository.getAccountsByEnabled(enabled as string === "true")
                .then((accounts: AccountEntity[]) => {
                    this.emitter.emit("account", {
                        method: "get",
                        response: {accounts: accounts},
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json(accounts);
                })
                .catch(e => {
                    this.emitter.emit("account", {
                        method: "get",
                        response: e,
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: e.message});
                });
        }
        this.repository.getAccounts()
            .then((accounts: AccountEntity[]) => {
                this.emitter.emit("account", {
                    method: "get",
                    response: {accounts: accounts.filter((account: AccountEntity) => account.removed === null || account.removed === undefined)},
                    code: OK_REQUEST_CODE
                });
                return res.status(OK_REQUEST_CODE).json(accounts.filter((account: AccountEntity) => account.removed === null || account.removed === undefined));
            })
            .catch(e => {
                this.emitter.emit("account", {
                    method: "get",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    public getOne (req: express.Request, res: express.Response): express.Response {
        const id = Number(req.params.id);
        if (!id || !Number.isFinite(id)) {
            this.emitter.emit("account", {
                method: "getOne",
                response: new Error("invalid parameters"),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
        }
        this.repository.getAccountById(id)
            .then((account: AccountEntity) => {
                if (account) {
                    this.emitter.emit("account", {
                        method: "getOne",
                        response: {account: account},
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json({account: account});
                }
            })
            .catch(e => {
                this.emitter.emit("account", {
                    method: "getOne",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    public update (req: express.Request, res: express.Response): express.Response {
        if (!req.body.id) {
            this.emitter.emit("account", {
                method: "update",
                response: new Error("invalid parameters"),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
        }
        this.repository.getAccountById(req.body.id)
            .then((account: AccountEntity) => {
                if (account) {
                    // change account status
                    if (req.body.name) {
                        account.name = req.body.name;
                    }
                    if (req.body.email) {
                        account.email = req.body.email;
                    }
                    if (req.body.fid) {
                        account.fid = req.body.fid;
                    }
                    if (req.body.uid) {
                        account.uid = req.body.uid;
                    }
                    if (req.body.customerPortalId) {
                        account.customerPortalId = req.body.customerPortalId;
                    }
                    if (req.body.type) {
                        account.type = req.body.type;
                    }
                    if (req.body.status) {
                        account.status = req.body.status;
                    }
                    if (account.enabled !== req.body.enabled) {
                        account.enabled = req.body.enabled;
                    }
                    if (req.body.users) {
                        account.users = req.body.users;
                    }
                    account.save()
                        .then((r: AccountEntity) => {
                            this.emitter.emit("account", {
                                method: "update",
                                response: {account: r},
                                code: OK_REQUEST_CODE
                            });
                            return res.status(OK_REQUEST_CODE).json({account: r});
                        })
                        .catch((e: Error) => {
                            this.emitter.emit("account", {
                                method: "update",
                                response: e,
                                code: BAD_REQUEST_CODE
                            });
                            return res.status(BAD_REQUEST_CODE).json({message: e.message});
                        });
                }
            })
            .catch(e => {
                this.emitter.emit("account", {
                    method: "update",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }

    public create (req: express.Request, res: express.Response): express.Response {
        try {
            const credentials = req.body;
            if (credentials.name === "") {
                throw new Error(ERROR_ACCOUNT_EMPTY_NAME);
            }
            if (credentials.email === "") {
                throw new Error(ERROR_ACCOUNT_EMPTY_EMAIL);
            }
            if (credentials.name !== "") {
                (async () => {
                    try {
                        const account = await this.repository.getAccountByName(credentials.name);
                        if (account) {
                            if (account.removed !== null) {
                                account.removed = undefined;
                                account.enabled = true;
                                this.emitter.emit("account", {
                                    method: "create",
                                    response: {account: account},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json({account: await account.save()});
                            } else {
                                this.emitter.emit("account", {
                                    method: "create",
                                    response: new Error("account exists"),
                                    code: BAD_REQUEST_CODE
                                });
                                return res.status(BAD_REQUEST_CODE).json({message: "account exists"});
                            }
                        }
                        this.repository
                            .create(new AccountEntity(
                                null,
                                credentials.name,
                                credentials.email,
                                credentials.fid,
                                credentials.uid,
                                credentials.customerPortalId,
                                credentials.type,
                                credentials.status,
                                !!credentials.enabled,
                            ))
                            .then((account: AccountEntity) => {
                                this.emitter.emit("account", {
                                    method: "create",
                                    response: {account: account},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json({account: account});
                            })
                            .catch(e => {
                                this.emitter.emit("account", {
                                    method: "create",
                                    response: e,
                                    code: BAD_REQUEST_CODE
                                });
                                return res.status(BAD_REQUEST_CODE).json({message: e.message});
                            });
                    } catch (e) {
                        this.emitter.emit("account", {
                            method: "create",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    }
                })();
            }
        } catch (e) {
            this.emitter.emit("account", {
                method: "create",
                response: e,
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: e.message});
        }
    }

    public delete (req: express.Request, res: express.Response): express.Response {
        if (!req.body.id) {
            this.emitter.emit("account", {
                method: "delete",
                response: new Error("invalid parameters"),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({message: "invalid parameters"});
        }
        this.repository.getAccountById(req.body.id)
            .then(async (account: AccountEntity) => {
                if (account) {
                    try {
                        const removedAccount = await account.remove();
                        this.emitter.emit("account", {
                            method: "create",
                            response: {account: removedAccount},
                            code: OK_REQUEST_CODE
                        });
                        return res.status(OK_REQUEST_CODE).json({account: removedAccount});
                    } catch (e) {
                        this.emitter.emit("account", {
                            method: "delete",
                            response: e,
                            code: BAD_REQUEST_CODE
                        });
                        return res.status(BAD_REQUEST_CODE).json({message: e.message});
                    }
                } else {
                    this.emitter.emit("account", {
                        method: "delete",
                        response: new Error("no accounts found"),
                        code: BAD_REQUEST_CODE
                    });
                    return res.status(BAD_REQUEST_CODE).json({message: "no accounts found"});
                }
            })
            .catch(e => {
                this.emitter.emit("account", {
                    method: "delete",
                    response: e,
                    code: BAD_REQUEST_CODE
                });
                return res.status(BAD_REQUEST_CODE).json({message: e.message});
            });
    }
}