import bcrypt from "bcrypt";
import {Service} from "../services/app.service";
import {CONFIG_SERVICE, POSTGRES_SERVICE, USER_REPOSITORY} from "../services/app.constants";
import { Config } from "../infrastructure/util/secrets";
import {IUserServiceRepository} from "../infrastructure/database/postgres/interface/user.repository.interface";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";
export const ROOT_ID = 1;

type comparePasswordFunction = (candidatePassword: string, cb: (err: Error, isMatch: boolean) => (void)) => any;

export type PublicUser = {
  id: number;
  username: string;
  gravatar: string;
  email:    string;
  enabled:  boolean;
  removed:  Date;
  expired:  number;
  token:    string;
  updated:  Date;
  roles:    number[] | string[];
  accounts: number[] | string[];
}

export class UserEntity {
  public  comparePassword: comparePasswordFunction;
  public  save: () => Promise<UserEntity>;
  public  remove: () => Promise<UserEntity>;

  constructor(
    public readonly id: number,
    public          username: string,
    public          email:    string,
    public          password: string,
    public          enabled:  boolean,
    public          secret?: string,
    public readonly gravatar?: string,
    public          passwordResetToken?: string,
    public          passwordResetExpires?: number,
    public readonly created?:  Date,
    public readonly updated?:  Date,
    public          removed?:  Date,
    public          roles?:    number[],
    public          accounts?: number[]
  ) {
    this.comparePassword = function (candidatePassword, cb) {
      bcrypt.compare(candidatePassword.toString(), this.password, (err: Error, isMatch: boolean) => {
        cb(err, isMatch);
      });
    };

    this.save = function (): Promise<UserEntity> {
      return Service.getRepository<IUserServiceRepository>(USER_REPOSITORY).update(this);
    };

    const table = Service.getService<IPostgresFactory>(POSTGRES_SERVICE).tables.USERS_TABLE;
    
    this.remove = function (): Promise<UserEntity> {
      return Service.getRepository<IUserServiceRepository>(USER_REPOSITORY)
        .remove<UserEntity>(this, table);
    };
  }

  setSecret(secret: string): void {
    const config = Service.getService<Config>(CONFIG_SERVICE);
    this.secret = this.username === config.testUser.username
      ? config.testUser.secret
      : secret;
  }
}
