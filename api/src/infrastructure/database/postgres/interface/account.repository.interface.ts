import {AccountEntity} from "../../../../accounts/account.entity";

export interface IAccountServiceRepository {
  get(): Promise<AccountEntity[]>
  getById(id: number): Promise<AccountEntity>
  getByName(name: string): Promise<AccountEntity>

  create(entity: AccountEntity): Promise<AccountEntity>
  update(entity: AccountEntity): Promise<AccountEntity>
  remove<T extends AccountEntity>(entity: T, table: string): Promise<T>
}
