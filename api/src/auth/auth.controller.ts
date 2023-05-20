import speakeasy from "speakeasy";
import Passport2faTotp from "passport-2fa-totp";
import express from "express";
import {
  BaseController
} from "../base.controller";
import {IAuthController} from "../infrastructure/interface/interface.controller";

import {Service} from "../services/app.service";

import {USER_REPOSITORY} from "../services/app.constants";
import passport from "passport";
import oauth, { Token } from "client-oauth2";
import {PublicUser, UserEntity} from "../users/user.entity";

import crypto from "crypto";
import {mockProviderData} from "./mock.auth.controller";
import {IUserServiceRepository} from "../infrastructure/database/postgres/interface/user.repository.interface";
import {HttpExceptionMessages, HttpStatus} from "../infrastructure/exception/auth.exception.messages";
import {GetUserResponse} from "../users/response/get.user.response";
import {PostForgotResponse} from "../users/response/post.forgot.response";
import {HttpException} from "../infrastructure/exception/http.exception";
import {AnyDayVariable} from "app";

const GoogleAuthenticator = Passport2faTotp.GoogeAuthenticator;

export class AuthController extends BaseController implements IAuthController {
  repository: IUserServiceRepository;
  entity:     string;

  constructor() {
    super();

    this.repository = Service.getRepository<IUserServiceRepository>(USER_REPOSITORY);
    this.entity = "authController";

    this.init();

    this.get      = this.get.bind(this);
    this.check    = this.check.bind(this);
    this.login    = this.login.bind(this);
    this.ga2fa    = this.ga2fa.bind(this);
    this.callback = this.callback.bind(this);
    this.signup   = this.signup.bind(this);
    this.forgot   = this.forgot.bind(this);
    this.reset    = this.reset.bind(this);
    this.logout   = this.logout.bind(this);

    this.emitter.on(this.entity, (message) => {
      this.compileLogger(this.entity, message);
    });
  }

  public static getPublicUser(user: UserEntity): PublicUser {
    return {
      id: user.id,
      username: user.username,
      gravatar: user.gravatar,
      email: user.email,
      enabled: user.enabled,
      removed: user.removed,
      expired: null,
      token: null,
      updated: user.updated,
      roles: user.roles,
      accounts: user.accounts
    };
  }

  private error(code: number, message: string): HttpException {
    return super.exceptionError("AuthHttpException", code, message);
  }

  private init() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LocalStrategy = require("passport-local").Strategy;

    passport.serializeUser(function(user: UserEntity, done) {
      if (user && user.id) {
        done(null, user.id);
      } else {
        done(new Error(HttpExceptionMessages.INCORRECT_CREDENTIALS), null);
      }
    });

    passport.deserializeUser(async function(id, done){
      const repository = Service.getRepository<IUserServiceRepository>(USER_REPOSITORY);
      try {
        const user = await repository.getById(id as number);
        done(null, user);
      } catch (e) {
        done(e, null);
      }
    });

    passport.use(new LocalStrategy(
      {
        usernameField: "email"
      }, async (email: string, password: string, done: AnyDayVariable) => {
        const repository = Service.getRepository<IUserServiceRepository>(USER_REPOSITORY);
        try {
          const user = await repository.getByEmail(email);
          if (user) {
            user.comparePassword(password, (e: Error, isMatch: boolean) => {
              if (e) { return done(e); }
              if (isMatch) {
                return done(undefined, user);
              }
              done(this.error(HttpStatus.UNAUTHORIZED, HttpExceptionMessages.WRONG_PASSWORD), undefined);
            });
          } else {
            done(this.error(HttpStatus.UNAUTHORIZED, HttpExceptionMessages.USER_NOT_FOUND), undefined);
          }
        } catch (e) {
          done(e, undefined);
        }
      })
    );

  }

  private createRandomToken (): Promise<string> {
    return new Promise((resolve) => {
      crypto.randomBytes(16, (err:Error | null, buf: Buffer) => {
        resolve(buf.toString("hex"));
      });
    });
  }

  private loginUser (req: express.Request, res: express.Response) {
    return passport.authenticate("local", (e: Error, user: UserEntity) => {
      if (e) {
        return res.status(HttpStatus.UNAUTHORIZED).json({message: e.message});
      }
      if (user) {
        req.logIn(user, (e) => {
          if (e) {
            return res.status(HttpStatus.UNAUTHORIZED).json({message: HttpExceptionMessages.INCORRECT_CREDENTIALS});
          }
          return res.status(HttpStatus.OK).json(new GetUserResponse(AuthController.getPublicUser(user)));
        });
      } else {
        return res.status(HttpStatus.UNAUTHORIZED).json(HttpExceptionMessages.USER_NOT_FOUND);
      }
    })(req, res);
  }

  public login (req: express.Request, res: express.Response): Promise<express.Response> {
    return this.loginUser(req, res);
  }

  public get (req: express.Request, res: express.Response): Promise<express.Response> {
    return new Promise((resolve) => resolve(res.send({ ping: "pong" })));
  }

  public check (req: express.Request, res: express.Response): express.Response {
    if (req.headers.authorization) {
      const authorization = req.headers.authorization.includes("Bearer")
        ? req.headers.authorization : `Bearer ${req.headers.authorization}`;
      Service
        .fetchJSON(`${this.config.services.provider}/api/v1/validate`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authorization
          }
        })
        .then((response) => {
          if (typeof response === "string") {
            throw this.error(HttpStatus.BAD_REQUEST, response);
          }
          if (response["user_id"]) {
            return this.repository.getByName(response["user_id"])
              .then((user: UserEntity) => {
                if (user) {
                  return res.status(HttpStatus.OK).json(new GetUserResponse(AuthController.getPublicUser(user)));
                } else {
                  throw this.error(HttpStatus.BAD_REQUEST, HttpExceptionMessages.USER_NOT_FOUND);
                }
              });
          }
        })
        .catch ((e: Error) => {
          this.logger.error(e.message, {service: this.entity});
          return res.status(HttpStatus.UNAUTHORIZED).json({ message: e.message });
        });
    } else {
      this.logger.error(HttpExceptionMessages.ERROR_VALIDATION, {service: this.entity});
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: HttpExceptionMessages.ERROR_VALIDATION });
    }
  }

  public ga2fa (req: express.Request, res: express.Response): express.Response {
    const { id, qr, code} = req.body;
    if (id) {
      this.repository
        .getById(id)
        .then((user: UserEntity) => {
          if (user) {
            if ((!user.secret || user.secret === "") && !code) {
              const qrInfo = GoogleAuthenticator.register(user.email);
              // req.session.qr = qrInfo;
              user.setSecret(qrInfo.secret);
              return user.save()
                .then(() => {
                  return res.status(HttpStatus.UNAUTHORIZED).send({
                    qr: qrInfo.qr,
                    secret: qrInfo.secret
                  });
                })
                .catch((e: Error) => {
                  throw this.error(HttpStatus.BAD_REQUEST, e.message);
                });
            } else {
              if (code) {
                const verified = speakeasy.totp.verify({
                  secret: user.secret,
                  encoding: "base32",
                  token: req.body.code
                });
                if (verified || (user.secret === this.config.testUser.secret && code === this.config.testUser.code)) {
                  // get new credentials
                  if (process.env["NODE_ENV"] === "test") {
                    return res.status(HttpStatus.OK).send({
                      status: verified,
                      data: mockProviderData
                    });
                  }
                  return Service.fetchJSON(`${this.config.services.provider}/api/v1/credentials?domain=${this.config.app.domain}&client_id=${user.email}`)
                    .then(oAuthCredentials => {
                      const auth = new oauth({
                        clientId: oAuthCredentials.client_id,
                        clientSecret: oAuthCredentials.client_secret,
                        accessTokenUri: `${this.config.services.provider}/api/v1/token`,
                        authorizationUri: `${this.config.services.provider}/api/v1/authorize`,
                        redirectUri: `//${this.config.app.domain}:${this.config.app.port}/api/v1/auth/callback`,
                        scopes: ["all"],
                        state: this.config.app.state
                      });
                      return Service.fetchJSON(auth.code.getUri(), {method: "GET"})
                        .then(callback => {
                          auth.code
                            .getToken(callback.originalUrl, {
                              query: {
                                "client_id": oAuthCredentials.client_id,
                                "client_secret": oAuthCredentials.client_secret
                              }
                            })
                            .then((r: Token) => {
                              this.emitter.emit("auth", {
                                method: "ga2fa",
                                response: {status: verified, data: r.data},
                                code: HttpStatus.OK
                              });
                              return res.status(HttpStatus.OK).send({
                                status: verified,
                                data: r.data
                              });
                            })
                            .catch((e: Error) => {
                              throw e;
                            });
                        })
                        .catch((e: Error) => {
                          throw e;
                        });
                    })
                    .catch((e: Error) => {
                      this.logger.error(e.message, {service: this.entity});
                      return res.status(HttpStatus.UNAUTHORIZED).json({message: e.message});
                    });
                }
                else {
                  this.logger.error(HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE, {service: this.entity});
                  return res.status(HttpStatus.UNAUTHORIZED).send({ message: HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE });
                }
              }
              this.logger.error(HttpExceptionMessages.ERROR_GA2FA_NO_CODE, {service: this.entity});
              return res.status(HttpStatus.UNAUTHORIZED).send({message: HttpExceptionMessages.ERROR_GA2FA_NO_CODE});
            }
          } else {
            this.logger.error(HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE, {service: this.entity});
            return res.status(HttpStatus.UNAUTHORIZED).send({ message: HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE });
          }
        })
        .catch(e => {
          this.logger.error(e.message, {service: this.entity});
          return res.status(HttpStatus.UNAUTHORIZED).send({ message: e.message });
        });
    } else {
      this.logger.error(HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE, {service: this.entity});
      return res.status(HttpStatus.UNAUTHORIZED).send({ message: HttpExceptionMessages.ERROR_GA2FA_INCORRECT_CODE });
    }
  }

  async validateSignup(credentials: {
    username: string;
    email: string;
    password: string;
    confirm: string;
  }): Promise<void> {
    if (!credentials.username) {
      throw this.error(HttpStatus.BAD_REQUEST, "username was not provided");
    }
    if (!credentials.email) {
      throw this.error(HttpStatus.BAD_REQUEST, "email was not provided");
    }
    if (!credentials.password) {
      throw this.error(HttpStatus.BAD_REQUEST, "password was not provided");
    }
    if (credentials.confirm !== credentials.password) {
      throw this.error(HttpStatus.BAD_REQUEST, "password is not match");
    }

    try {
      const exist = await this.repository.getByEmail(credentials.email);
      if (exist) {
        throw this.error(HttpStatus.CONFLICT, HttpExceptionMessages.USER_ALREADY_EXISTS);
      }
    } catch (e) {
      if (e.message === HttpExceptionMessages.USER_ALREADY_EXISTS) {
        throw e;
      }
      if (e.message === HttpExceptionMessages.USER_NOT_FOUND) {
      }
    }

    try {
      const exist = await this.repository.getByUsername(credentials.username);
      if (exist) {
        throw this.error(HttpStatus.CONFLICT, HttpExceptionMessages.USER_ALREADY_EXISTS);
      }
    } catch (e) {
      if (e.message === HttpExceptionMessages.USER_ALREADY_EXISTS) {
        throw e;
      }
      if (e.message === HttpExceptionMessages.USER_NOT_FOUND) {

      }
    }

  }

  public async signup (req: express.Request, res: express.Response): Promise<express.Response> {
    const credentials = req.body;
    try {
      await this.validateSignup(credentials);

      const user = await this.repository
        .create(new UserEntity(null, credentials.username, credentials.email, credentials.password, false));

      return res.status(HttpStatus.OK).json(new GetUserResponse(AuthController.getPublicUser(user)));
    } catch (e) {
      this.logger.error(e, {service: "signup"});
      if (e instanceof HttpException) {
        return res.status(e.statusCode).send({
          message: e.message,
        });
      }
      throw e;
    }
  }

  public callback(req: express.Request, res: express.Response): express.Response {
    if (!req.query.code) {
      throw this.error(HttpStatus.BAD_REQUEST, `no code at ${req.originalUrl}`);
    }
    if (!req.query.state) {
      throw this.error(HttpStatus.BAD_REQUEST, `no state at ${req.originalUrl}`);
    }
    return res.status(HttpStatus.OK).json({code: req.query.code, state: req.query.state, originalUrl: req.originalUrl});
  }

  public logout (req: express.Request, res: express.Response): Promise<express.Response> {
    const { id } = req.body;
    if (!id) {
      throw this.error(HttpStatus.BAD_REQUEST, "id was not provided");
    }
    return this.repository.getById(id as number)
      .then((entity: UserEntity) => {
        if (!entity) {
          throw this.error(HttpStatus.NOT_FOUND, HttpExceptionMessages.USER_NOT_FOUND);
        }
        return res.status(HttpStatus.OK).json(new GetUserResponse(AuthController.getPublicUser(entity)));
      })
      .catch ((e: Error) => {
        this.logger.error(e.message, {service: this.entity});
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: e.message });
      });
  }

  public forgot (req: express.Request, res: express.Response): express.Response {
    if (!req.body.email || req.body.email === "") {
      return res.status(HttpStatus.UNAUTHORIZED).send({message: HttpExceptionMessages.ERROR_AUTH_EMPTY_EMAIL});
    }
    this.repository.getByName(req.body.email).then((user: UserEntity) => {
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).send({message: HttpExceptionMessages.USER_NOT_FOUND});
      }
      this.createRandomToken().then(token => {
        user.passwordResetToken = token;
        user.passwordResetExpires = Date.now() + 3600000;
        // 1 hour
        user.save()
          .then((user: UserEntity) => {
            return res.status(HttpStatus.OK).json(new PostForgotResponse(token, AuthController.getPublicUser(user)));
          })
          .catch((e: Error) => {
            throw e;
        });
      });
    }).catch((e: Error) => {
      this.logger.error(e.message, {service: this.entity});
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: e.message });
    });
  }

  public reset (req: express.Request, res: express.Response): express.Response {
    if (!req.params.token || req.params.token === "" || req.params.token === ":token") {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: HttpExceptionMessages.ERROR_AUTH_INVALID_RESET_TOKEN });
    }

    this.repository.getByPasswordResetToken(req.params.token).then((user: UserEntity) => {
      if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: HttpExceptionMessages.USER_NOT_FOUND });
      }

      Service.hash(req.body.password).then(password => {
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save()
          .then((user: UserEntity) => {
            req.body.email = user.email ? user.email : user.username;
            this.loginUser(req, res);
          })
          .catch((e: Error) => {
            throw e;
          });
      }).catch((e: Error) => {
        this.logger.error(e.message, {service: this.entity});
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: e.message });
      });
    });
  }
}
