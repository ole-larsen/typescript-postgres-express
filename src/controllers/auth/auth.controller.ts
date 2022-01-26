"use strict";

import speakeasy from "speakeasy";
// @ts-ignore
import Passport2faTotp from "passport-2fa-totp";
import express from "express";
import {
    AuthControllerInterface,
    BAD_REQUEST_CODE,
    BaseController, OK_REQUEST_CODE,
    SessionRequest,
    UNAUTHORIZED_REQUEST_CODE
} from "../base.controller";
import logger from "../../util/logger";
import {Service} from "../../services/app.service";
import {Config} from "../../util/secrets";
import {UserRepository} from "../../infrastructure/storage/postgres/repository/user.repository";
import {CONFIG_SERVICE, EMITTER_SERVICE, USER_REPOSITORY_SERVICE} from "../../services/constants";
import EventEmitter from "events";
import passport from "passport";
import oauth, { Token } from "client-oauth2";
import { IVerifyOptions } from "passport-local";
import {PublicUser, UserEntity} from "../../infrastructure/entities/users.entity";
import {
    ERROR_AUTH_EMAIL,
    ERROR_AUTH_EMPTY_CREDENTIALS, ERROR_AUTH_EMPTY_EMAIL,
    ERROR_AUTH_EMPTY_PASSWORD_CREDENTIALS, ERROR_AUTH_INVALID_EMAIL, ERROR_AUTH_INVALID_RESET_TOKEN,
    ERROR_AUTH_PASSWORD_NOT_MATCH_CREDENTIALS,
    ERROR_AUTH_USERNAME,
    ERROR_GA2FA_INCORRECT_CODE,
    ERROR_GA2FA_NO_CODE,
    ERROR_VALIDATION
} from "./auth.error.codes";
import crypto from "crypto";
import async from "async";
import {AuthToken} from "../../infrastructure/interfaces/user.interface";

const GoogleAuthenticator = Passport2faTotp.GoogeAuthenticator;

export class AuthController extends BaseController implements AuthControllerInterface {
    config:     Config
    repository: UserRepository
    emitter:    EventEmitter

    constructor() {
        super();
        this.repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        this.emitter = Service.getService<EventEmitter>(EMITTER_SERVICE);
        this.config = Service.getService<Config>(CONFIG_SERVICE);

        this.get      = this.get.bind(this);
        this.check    = this.check.bind(this);
        this.login    = this.login.bind(this);
        this.ga2fa    = this.ga2fa.bind(this);
        this.callback = this.callback.bind(this);
        this.signup   = this.signup.bind(this);
        this.forgot   = this.forgot.bind(this);
        this.reset    = this.reset.bind(this);
        this.logout   = this.logout.bind(this);

        this.emitter.on("auth", (message) => {
            switch (message.code) {
                case OK_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.user) {
                            logger.info(`auth.${message.method}:${message.code} ${message.response.user.id} ${message.response.user.username}`);
                        } else {
                            logger.info(`auth.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        console.log(message);
                        logger.info(`auth.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case UNAUTHORIZED_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`auth.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`auth.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`auth.${message.method}:${message.code} ${message}`);
                    }
                    break;
                case BAD_REQUEST_CODE:
                    if (message.response) {
                        if (message.response.message) {
                            logger.error(`auth.${message.method}:${message.code} ${message.response.message}`);
                        } else {
                            logger.error(`auth.${message.method}:${message.code} ${message.response}`);
                        }
                    } else {
                        logger.error(`auth.${message.method}:${message.code} ${message}`);
                    }
                    break;
                default:
                    console.log(message.code, message.method);
                    break;
            }
        });
    }

    private createRandomToken(): Promise<string> {
        return new Promise((resolve) => {
            crypto.randomBytes(16, (err:Error | null, buf: Buffer) => {
                resolve(buf.toString("hex"));
            });
        });
    }

    private loginUser (req: express.Request, res: express.Response) {
        passport.authenticate("local", (e: Error, user: UserEntity, info: IVerifyOptions) => {
            if (e) {
                this.emitter.emit("auth", {
                    method: "loginUser",
                    response: new Error(`${req.body.email} ${e.message}`),
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).json({message: e.message});
            }
            if (user) {
                req.logIn(user, (e) => {
                    if (e) {
                        this.emitter.emit("auth", {
                            method: "loginUser",
                            response: new Error(`${req.body.email} ${e.message}`),
                            code: UNAUTHORIZED_REQUEST_CODE
                        });
                        return res.status(UNAUTHORIZED_REQUEST_CODE).json({message: e.message});
                    }
                    const publicUser: PublicUser = {
                        id: user.id,
                        username: user.username,
                        gravatar: user.gravatar,
                        email: user.email,
                        enabled: user.enabled,
                        removed: !!user.removed,
                        expired: null,
                        token: null,
                        roles: user.roles
                    };
                    this.emitter.emit("auth", {
                        method: "loginUser",
                        response: {user: publicUser},
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json({user: publicUser});
                });
            } else {
                this.emitter.emit("auth", {
                    method: "validate",
                    response: new Error("no user"),
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).json({user: null});
            }
        })(req, res);
    }

    /**
     * extend baseController
     * @param req
     * @param res
     */
    public get (req: express.Request, res: express.Response): express.Response {
        return res.send({ ping: "pong" });
    }

    /**
     * implement AuthControllerInterface
     * Check oauth token
     * @param req
     * @param res
     */
    public check (req: express.Request, res: express.Response): express.Response {
        if (req.headers.authorization) {
            const authorization = req.headers.authorization.includes("Bearer")
                ? req.headers.authorization : `Bearer ${req.headers.authorization}`;
            Service.fetchJSON(`${this.config.services.provider}/api/v1/validate`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authorization
                }
            }).then((r) => {
                if (typeof r === "string") {
                    this.emitter.emit("auth", {
                        method: "check",
                        response: new Error(r),
                        code: UNAUTHORIZED_REQUEST_CODE
                    });
                    return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: r });
                }
                if (r["user_id"]) {
                    this.repository.getUserByEmail(r["user_id"])
                        .then((user: UserEntity) => {
                            if (user) {
                                const publicUser: PublicUser = {
                                    id: user.id,
                                    username: user.username,
                                    gravatar: user.gravatar,
                                    email: user.email,
                                    enabled: user.enabled,
                                    removed: !!user.removed,
                                    expired: r.expires_in,
                                    token: r.access_token,
                                    roles: user.roles
                                };
                                this.emitter.emit("auth", {
                                    method: "check",
                                    response: { user: publicUser  },
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).json({ user: publicUser });
                            } else {
                                this.emitter.emit("auth", {
                                    method: "check",
                                    response: new Error("no user"),
                                    code: UNAUTHORIZED_REQUEST_CODE
                                });
                                return res.status(UNAUTHORIZED_REQUEST_CODE).json({ user: null });
                            }
                        })
                        .catch(e => {
                            this.emitter.emit("auth", {
                                method: "check",
                                response: e,
                                code: UNAUTHORIZED_REQUEST_CODE
                            });
                            return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                        });
                }
            }).catch (e => {
                this.emitter.emit("auth", {
                    method: "check",
                    response: e,
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
            });
        } else {
            this.emitter.emit("auth", {
                method: "check",
                response: new Error(ERROR_VALIDATION),
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: ERROR_VALIDATION });
        }
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public login (req: SessionRequest, res: express.Response): express.Response {
        try {
            this.loginUser(req, res);
        } catch (e) {
            this.emitter.emit("auth", {method: "login", response: e, code: UNAUTHORIZED_REQUEST_CODE});
            return res.status(UNAUTHORIZED_REQUEST_CODE).json({message: e.message});
        }
    }

    /**
     * implements AuthControllerInterface
     * @param req
     * @param res
     */
    public ga2fa (req: express.Request, res: express.Response): express.Response {
        const credentials = req.body;
        if (credentials.id) {
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            try {
                repository.getUserById(credentials.id).then((user: UserEntity) => {
                    if (user) {
                        if ((!user.secret || user.secret === "") && !credentials.code) {
                            const qrInfo = GoogleAuthenticator.register(user.email);
                            // req.session.qr = qrInfo;
                            user.setSecret(qrInfo.secret);
                            user.save()
                            .then((u: UserEntity) => {
                                this.emitter.emit("auth", {
                                    method: "ga2fa",
                                    response: {user: u, qrInfo: qrInfo},
                                    code: OK_REQUEST_CODE
                                });
                                return res.status(OK_REQUEST_CODE).send({
                                    qr: qrInfo.qr,
                                    secret: qrInfo.secret
                                });
                            }).catch((e: Error) => {
                                throw e;
                            });
                        } else {
                            const verified = speakeasy.totp.verify({
                                secret: user.secret,
                                encoding: "base32",
                                token: credentials.code
                            });
                            if (verified) {
                                // get new credentials
                                Service.fetchJSON(`${this.config.services.provider}/api/v1/credentials?domain=${this.config.app.domain}&client_id=${user.email}`)
                                    .then(oAuthCredentials => {
                                        const auth = new oauth({
                                            clientId: oAuthCredentials.client_id,
                                            clientSecret: oAuthCredentials.client_secret,
                                            accessTokenUri: `${this.config.services.provider}/api/v1/token`,
                                            authorizationUri: `${this.config.services.provider}/api/v1/authorize`,
                                            redirectUri: `//${this.config.app.domain}:${this.config.app.port}/api/v1/auth/callback`,
                                            scopes: ["all"],
                                            state: "xyz"
                                        });
                                        Service.fetchJSON(auth.code.getUri(), {
                                            method: "GET"
                                        })
                                        .then(callback => {
                                            auth.code.getToken(callback.originalUrl, {
                                                query: {
                                                    "client_id": oAuthCredentials.client_id,
                                                    "client_secret": oAuthCredentials.client_secret
                                                }})
                                                .then((r: Token) => {
                                                    this.emitter.emit("auth", {
                                                        method: "ga2fa",
                                                        response: {status: verified, data: r.data},
                                                        code: OK_REQUEST_CODE
                                                    });
                                                    return res.status(OK_REQUEST_CODE).send({
                                                        status: verified,
                                                        data: r.data
                                                    });
                                                }).catch(e => {
                                                    throw e;
                                                });
                                        })
                                        .catch(e => {
                                            throw e;
                                        });
                                    })
                                    .catch(e => {
                                        this.emitter.emit("auth", {
                                            method: "ga2fa",
                                            response: e,
                                            code: UNAUTHORIZED_REQUEST_CODE
                                        });
                                        return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                                    });
                            } else {
                                if (!req.body.code) {
                                    this.emitter.emit("auth", {
                                        method: "ga2fa",
                                        response: new Error(ERROR_GA2FA_NO_CODE),
                                        code: OK_REQUEST_CODE
                                    });
                                    return res.status(OK_REQUEST_CODE).send({message: ERROR_GA2FA_NO_CODE});
                                } else {
                                    this.emitter.emit("auth", {
                                        method: "ga2fa",
                                        response: new Error(ERROR_GA2FA_INCORRECT_CODE),
                                        code: UNAUTHORIZED_REQUEST_CODE
                                    });
                                    return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: ERROR_GA2FA_INCORRECT_CODE });
                                }
                            }
                        }
                    } else {
                        this.emitter.emit("auth", {
                            method: "ga2fa",
                            response: new Error(ERROR_GA2FA_INCORRECT_CODE),
                            code: UNAUTHORIZED_REQUEST_CODE
                        });
                        return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: ERROR_GA2FA_INCORRECT_CODE });
                    }
                }).catch(e => {
                    throw e;
                });
            } catch (e) {
                this.emitter.emit("auth", {
                    method: "ga2fa",
                    response: e,
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: e.message });
            }
        } else {
            this.emitter.emit("auth", {
                method: "ga2fa",
                response: new Error(ERROR_GA2FA_INCORRECT_CODE),
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: ERROR_GA2FA_INCORRECT_CODE });
        }
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public signup (req: express.Request, res: express.Response): express.Response {
        const credentials = req.body;
        if (credentials.password === "") {
            this.emitter.emit("auth", {
                method: "signup",
                response: new Error(ERROR_AUTH_EMPTY_PASSWORD_CREDENTIALS),
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: ERROR_AUTH_EMPTY_PASSWORD_CREDENTIALS });
        }
        if (credentials.password !== credentials.confirm) {
            this.emitter.emit("auth", {
                method: "signup",
                response: new Error(ERROR_AUTH_PASSWORD_NOT_MATCH_CREDENTIALS),
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).send({ message: ERROR_AUTH_PASSWORD_NOT_MATCH_CREDENTIALS });
        }
        const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        (async () => {
            try {
                let sent = false;
                if (credentials.username !== "") {
                    const userByUsername = await repository.getUserByUsername(credentials.username);
                    if (userByUsername) {
                        if (userByUsername.removed !== null) {
                            userByUsername.removed = undefined;
                            userByUsername.enabled = true;
                            const user = await userByUsername.save();
                            const publicUser: PublicUser = {
                                id: user.id,
                                username: user.username,
                                gravatar: user.gravatar,
                                email: user.email,
                                enabled: user.enabled,
                                removed: !!user.removed,
                                expired: null,
                                token: null,
                                roles: user.roles
                            };
                            this.emitter.emit("auth", {
                                method: "signup",
                                response: {user: publicUser},
                                code: OK_REQUEST_CODE
                            });
                            sent = true;
                            return res.status(OK_REQUEST_CODE).json({user: publicUser});
                        } else {
                            sent = true;
                            throw new Error(userByUsername.username + " " + ERROR_AUTH_USERNAME);
                        }
                    }
                }
                if (credentials.email !== "" && sent === false) {
                    const userByEmail = await repository.getUserByEmail(credentials.email);
                    if (userByEmail) {
                        if (userByEmail.removed !== null) {
                            userByEmail.removed = undefined;
                            userByEmail.enabled = true;
                            const user = await userByEmail.save();
                            const publicUser: PublicUser = {
                                id: user.id,
                                username: user.username,
                                gravatar: user.gravatar,
                                email: user.email,
                                enabled: user.enabled,
                                removed: !!user.removed,
                                expired: null,
                                token: null,
                                roles: user.roles
                            };
                            this.emitter.emit("auth", {
                                method: "signup",
                                response: {user: publicUser},
                                code: OK_REQUEST_CODE
                            });
                            sent = true;
                            return res.status(OK_REQUEST_CODE).json({user: publicUser});
                        } else {
                            sent = true;
                            throw new Error(userByEmail.email + " " + ERROR_AUTH_EMAIL);
                        }
                    }
                }
                const user = await repository.create(new UserEntity(null, credentials.username, credentials.email, credentials.password, true));
                const publicUser: PublicUser = {
                    id: user.id,
                    username: user.username,
                    gravatar: user.gravatar,
                    email: user.email,
                    enabled: user.enabled,
                    removed: !!user.removed,
                    expired: null,
                    token: null,
                    roles: user.roles
                };
                this.emitter.emit("auth", {
                    method: "signup",
                    response: {user: publicUser},
                    code: OK_REQUEST_CODE
                });
                return res.status(OK_REQUEST_CODE).json({ user: publicUser });
            } catch (e) {
                this.emitter.emit("auth", {
                    method: "signup",
                    response: e,
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
            }
        })();
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public callback(req: express.Request, res: express.Response): express.Response {
        this.emitter.emit("auth", {
            method: "callback",
            response: JSON.stringify({code: req.query.code, state: req.query.state, originalUrl: req.originalUrl}),
            code: OK_REQUEST_CODE
        });
        return res.status(OK_REQUEST_CODE).json({code: req.query.code, state: req.query.state, originalUrl: req.originalUrl});
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public logout (req: express.Request, res: express.Response): express.Response {
        if (req.body.id) {
            const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
            repository.getUserById(req.body.id as number)
                .then((user: UserEntity) => {
                    if (!user) {
                        throw new Error(ERROR_AUTH_USERNAME);
                    }
                    const publicUser: PublicUser = {
                        id: user.id,
                        username: user.username,
                        gravatar: user.gravatar,
                        email: user.email,
                        enabled: user.enabled,
                        removed: !!user.removed,
                        expired: null,
                        token: null,
                        roles: user.roles
                    };
                    this.emitter.emit("auth", {
                        method: "logout",
                        response: { user: publicUser },
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json({ user: publicUser });
                })
                .catch (e => {
                    this.emitter.emit("auth", {
                        method: "logout",
                        response: e,
                        code: UNAUTHORIZED_REQUEST_CODE
                    });
                    return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                });
        } else {
            this.emitter.emit("auth", {
                method: "logout",
                response: new Error(ERROR_VALIDATION),
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: ERROR_VALIDATION });
        }
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public forgot (req: express.Request, res: express.Response): express.Response {
        if (req.body.email === "") {
            this.emitter.emit("auth", {
                method: "forgot",
                response: new Error(ERROR_AUTH_EMPTY_EMAIL),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).send({message: ERROR_AUTH_EMPTY_EMAIL});
        }
        const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        repository.getUserByEmail(req.body.email).then((user: UserEntity) => {
            if (!user) {
                this.emitter.emit("auth", {
                    method: "forgot",
                    response: new Error(ERROR_AUTH_INVALID_EMAIL),
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).send({message: ERROR_AUTH_INVALID_EMAIL});
            }
            this.createRandomToken().then(token => {
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000;
                 // 1 hour
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
                        roles: user.roles
                    };
                    this.emitter.emit("auth", {
                        method: "logout",
                        response: { user: publicUser, token: token },
                        code: OK_REQUEST_CODE
                    });
                    return res.status(OK_REQUEST_CODE).json({ user: publicUser, token: token });
                }).catch((e: Error) => {
                    this.emitter.emit("auth", {
                        method: "forgot",
                        response: e,
                        code: UNAUTHORIZED_REQUEST_CODE
                    });
                    return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                });
            });
        }).catch(e => {
            this.emitter.emit("auth", {
                method: "forgot",
                response: e,
                code: UNAUTHORIZED_REQUEST_CODE
            });
            return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
        });
    }

    /**
     * implement AuthControllerInterface
     * @param req
     * @param res
     */
    public reset (req: express.Request, res: express.Response): express.Response {
        if (req.params.token === "") {
            this.emitter.emit("auth", {
                method: "reset",
                response: new Error(ERROR_AUTH_INVALID_RESET_TOKEN),
                code: BAD_REQUEST_CODE
            });
            return res.status(BAD_REQUEST_CODE).json({ message: ERROR_AUTH_INVALID_RESET_TOKEN });
        }
        const repository = Service.getService<UserRepository>(USER_REPOSITORY_SERVICE);
        repository.getUserByPasswordResetToken(req.params.token).then((user: UserEntity) => {
            if (!user) {
                this.emitter.emit("auth", {
                    method: "reset",
                    response: new Error(ERROR_AUTH_INVALID_RESET_TOKEN),
                    code: UNAUTHORIZED_REQUEST_CODE
                });
                return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: ERROR_AUTH_INVALID_RESET_TOKEN });
            }
            if (user) {
                Service.hash(req.body.password).then(password => {
                    user.password = password;
                    user.passwordResetToken = undefined;
                    user.passwordResetExpires = undefined;
                    user.save()
                    .then((u: UserEntity) => {
                        req.body.email = u.email ? u.email : u.username;
                        // TODO add password email instructions
                        this.loginUser(req, res);
                    })
                    .catch((e: Error) => {
                        this.emitter.emit("auth", {
                            method: "reset",
                            response: e,
                            code: UNAUTHORIZED_REQUEST_CODE
                        });
                        return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                    });
                }).catch(e => {
                    this.emitter.emit("auth", {
                        method: "reset",
                        response: e,
                        code: UNAUTHORIZED_REQUEST_CODE
                    });
                    return res.status(UNAUTHORIZED_REQUEST_CODE).json({ message: e.message });
                });
            }
        });
    }
}
