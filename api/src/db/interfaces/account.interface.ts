import {AccountEntity} from "../entities/accounts.entity";

/**
 * Account Service interface for binding
 */
export interface IAccountServiceRepository {
    getAccounts(): Promise<AccountEntity[]>
    getAccountsByEnabled(enabled: boolean): Promise<AccountEntity[]>
    getAccountById(id: number): Promise<AccountEntity>
    getAccountByName(name: string): Promise<AccountEntity>

    update(account: AccountEntity): Promise<AccountEntity>
    create(account: AccountEntity): Promise<AccountEntity>
    remove(account: AccountEntity): Promise<AccountEntity>
}
