import { Pool } from "pg";
import {POSTGRES_SERVICE} from "../../../../services/app.constants";
import {Service} from "../../../../services/app.service";
import {ACCOUNTS_TABLE, ROLES_TABLE, USER_ACCOUNT_TABLE, USER_ROLE_TABLE, USERS_TABLE} from "./constants.repository";
import {IAccountServiceRepository} from "../../../interfaces/account.interface";
import {AccountEntity} from "../../../entities/accounts.entity";

/**
 * Account Repository.
 */
export class AccountRepository implements IAccountServiceRepository {
    private readonly database: Pool;
    private readonly usersTable: string;
    private readonly rolesTable: string;
    private readonly userRoleTable: string;
    private readonly accountsTable: string;
    private readonly userAccountTable: string;
    constructor() {
        this.database = Service.getService<Pool>(POSTGRES_SERVICE);
        this.usersTable = USERS_TABLE;
        this.rolesTable = ROLES_TABLE;
        this.userRoleTable = USER_ROLE_TABLE;
        this.accountsTable = ACCOUNTS_TABLE;
        this.userAccountTable = USER_ACCOUNT_TABLE;
    }

    private getOne(field: string, id: number | string | boolean): Promise<AccountEntity[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                      SELECT ${this.accountsTable}.id,
                             ${this.accountsTable}.name,
                             ${this.accountsTable}.email,
                             ${this.accountsTable}.fid,
                             ${this.accountsTable}.uid,
                             ${this.accountsTable}.customer_portal_id,
                             ${this.accountsTable}.type,
                             ${this.accountsTable}.status,
                             ${this.accountsTable}.enabled,
                             ${this.accountsTable}.created,
                             ${this.accountsTable}.updated,
                             ${this.accountsTable}.removed,
                             array_remove(ARRAY_AGG(${this.usersTable}.id), NULL) ${this.usersTable}
                      FROM ${this.accountsTable}
                          
                      LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.account_id = ${this.accountsTable}."id")
                      LEFT JOIN ${this.usersTable} ON (${this.usersTable}.id = ${this.userAccountTable}.user_id)
                      WHERE ${this.accountsTable}."${field}" = $1
                      GROUP BY ${this.accountsTable}."id" ORDER BY "id" ASC`, [id]);
                const accounts = result.rows.map(row => new AccountEntity(
                        row.id,
                        row.name,
                        row.email,
                        row.fid,
                        row.uid,
                        row.customer_portal_id,
                        row.type,
                        row.status,
                        row.enabled,
                        row.created,
                        row.updated,
                        row.removed,
                        row.users));
                if (accounts && accounts.length > 0) {
                    resolve(accounts);
                } else {
                    resolve([]);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    /**
     * get all accounts
     */
    public get(): Promise<AccountEntity[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                      SELECT ${this.accountsTable}.id,
                             ${this.accountsTable}.name,
                             ${this.accountsTable}.email,
                             ${this.accountsTable}.fid,
                             ${this.accountsTable}.uid,
                             ${this.accountsTable}.customer_portal_id,
                             ${this.accountsTable}.type,
                             ${this.accountsTable}.status,
                             ${this.accountsTable}.enabled,
                             ${this.accountsTable}.created,
                             ${this.accountsTable}.updated,
                             ${this.accountsTable}.removed,
                            array_remove(ARRAY_AGG(${this.usersTable}.id), NULL) ${this.usersTable}
                      FROM ${this.accountsTable}
                      LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.account_id = ${this.accountsTable}."id")
                      LEFT  JOIN ${this.usersTable} ON (${this.usersTable}.id = ${this.userAccountTable}.user_id)
                      GROUP BY ${this.accountsTable}."id" ORDER BY "id" ASC`);
                const accounts = result.rows.map(row => new AccountEntity(
                    row.id,
                    row.name,
                    row.email,
                    row.fid,
                    row.uid,
                    row.customer_portal_id,
                    row.type,
                    row.status,
                    row.enabled,
                    row.created,
                    row.updated,
                    row.removed,
                    row.users));
                if (accounts && accounts.length > 0) {
                    resolve(accounts);
                } else {
                    resolve([]);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    /**
     * Get all active accounts
     */
    public getAccountsByEnabled(enabled: boolean): Promise<AccountEntity[]> {
        return this.getOne("enabled", enabled);
    }

    public getById(id: number): Promise<AccountEntity> {
        return new Promise((resolve, reject) => {
            this.getOne("id", id)
                .then((accounts: AccountEntity[]) => {
                    if (accounts.length > 0) {
                        resolve(accounts[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    public getByName(name: string): Promise<AccountEntity> {
        return new Promise((resolve, reject) => {
            this.getOne("name", name)
                .then((accounts: AccountEntity[]) => {
                    if (accounts.length > 0) {
                        resolve(accounts[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    public update(account: AccountEntity): Promise<AccountEntity> {
        return new Promise(async (resolve, reject) => {
            // in case of error we can easily find an error using try catch for every async method
            try {
                try {
                    await this.database.query(
    `UPDATE ${this.accountsTable}
                         SET name = $2,
                             email = $3,
                             fid = $4,
                             uid = $5,
                             customer_portal_id = $6,
                             type = $7,
                             status = $8,
                             enabled = $9
                         WHERE id = $1 RETURNING *;`,
                            [
                                account.id,
                                account.name,
                                account.email,
                                account.fid,
                                account.uid,
                                account.customerPortalId,
                                account.type,
                                account.status,
                                account.enabled
                            ]
                        );
                } catch (e) {
                    throw e;
                }
                try {
                    if (account && account.id) {
                        await this.database.query(`
                        DELETE
                        FROM ${this.userAccountTable}
                        WHERE account_id = $1`, [
                            account.id
                        ]);
                    }
                } catch (e) {
                    throw e;
                }
                try {
                    if (account && account.id && account.users) {
                        await Promise.all(account.users.map(async(userId) => {
                            if (userId) {
                                await this.database.query(`
                                INSERT INTO ${this.userAccountTable}
                                SELECT u.id, a.id
                                FROM ${this.accountsTable} a
                                    LEFT JOIN ${this.usersTable} u ON u.id = $1
                                WHERE a.id = $2`, [
                                    userId, account.id
                                ]);
                            }
                        }));
                    }
                } catch (e) {
                    throw e;
                }
                resolve(this.getById(account.id));
            } catch (e) {
                reject(e);
            }
        });
    }

    public remove(account: AccountEntity): Promise<AccountEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.database.query(`
                    DELETE FROM ${this.userAccountTable}
                    WHERE account_id = $1`, [
                    account.id
                ]);
            } catch (e) {
                reject(e);
            }
            try {
                if (process.env.NODE_ENV === "test") {
                    await this.database.query(
                        `DELETE FROM ${this.rolesTable}
                                 WHERE id = $1;`,
                        [
                            account.id
                        ]
                    );
                } else {
                    await this.database.query(
                        `UPDATE ${this.accountsTable}
                         SET removed = NOW(),
                             enabled = FALSE
                         WHERE id = $1 RETURNING *;`, [
                            account.id
                        ]);
                }
                account.removed = new Date();
                account.enabled = false;
                resolve(account);
            } catch (e) {
                reject(e);
            }
        });
    }

    public create(account: AccountEntity): Promise<AccountEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.database.query(
`INSERT INTO ${this.accountsTable} (
                    name, 
                    email, 
                    fid,
                    uid,
                    customer_portal_id,
                    type,
                    status,
                    enabled) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        account.name,
                        account.email,
                        account.fid,
                        account.uid,
                        account.customerPortalId,
                        account.type,
                        account.status,
                        true
                    ]
                );
                resolve(this.getByName(account.name));
            } catch (e) {
                reject(e);
            }
        });
    }

}
