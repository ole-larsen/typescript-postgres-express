import {Service} from "../services/app.service";
import {ACCOUNT_REPOSITORY, POSTGRES_SERVICE} from "../services/app.constants";
import {IAccountServiceRepository} from "../infrastructure/database/postgres/interface/account.repository.interface";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";

export class AccountEntity {
  public save: () => Promise<AccountEntity>;
  public remove: () => Promise<AccountEntity>;

  constructor(
    public readonly id?: number,
    public          name?: string,
    public          email?: string,
    public          status?: string,
    public          enabled?: boolean,
    public readonly created?: Date,
    public readonly updated?: Date,
    public          removed?: Date,
    public          users?: number[]
  ) {
    this.save = function (): Promise<AccountEntity> {
      return Service.getRepository<IAccountServiceRepository>(ACCOUNT_REPOSITORY).update(this);
    };

    const table = Service.getService<IPostgresFactory>(POSTGRES_SERVICE).tables.ACCOUNTS_TABLE;

    this.remove = function (): Promise<AccountEntity> {
      return Service.getRepository<IAccountServiceRepository>(ACCOUNT_REPOSITORY)
        .remove<AccountEntity>(this, table);
    };
  }
}
