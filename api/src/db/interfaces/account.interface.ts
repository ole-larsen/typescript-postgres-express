import {AccountEntity} from "../entities/accounts.entity";

/**
 * Account Service interface for binding
 */
export interface IAccountServiceRepository {
    get(): Promise<AccountEntity[]>
    getAccountsByEnabled(enabled: boolean): Promise<AccountEntity[]>
    getById(id: number): Promise<AccountEntity>
    getByName(name: string): Promise<AccountEntity>

    update(account: AccountEntity): Promise<AccountEntity>
    create(account: AccountEntity): Promise<AccountEntity>
    remove(account: AccountEntity): Promise<AccountEntity>
}
