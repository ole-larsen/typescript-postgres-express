import {Pool} from "pg";
import {POSTGRES_SERVICE} from "../../../../services/app.constants";
import {Service} from "../../../../services/app.service";
import {IUserServiceRepository} from "../../../interfaces/user.interface";
import {ROOT_ID, UserEntity} from "../../../entities/users.entity";

import crypto from "crypto";
import {
    ACCOUNTS_TABLE,
    ROLES_TABLE,
    USER_ACCOUNT_TABLE,
    USER_ROLE_TABLE,
    USERS_TABLE
} from "./constants.repository";
import {USER_ROLE_ID} from "../../../entities/roles.entity";

/**
 * User Repository.
 */

// userSchema.methods.comparePassword = comparePassword;
export class UserRepository implements IUserServiceRepository {
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

    /**
     * get gravatar
     * @param email
     * @param size
     * @private
     */
    private gravatar (email: string, size: number = 200) {
        if (!email) {
            return `https://gravatar.com/avatar/?s=${size}&d=retro`;
        }
        const md5 = crypto.createHash("md5").update(email).digest("hex");
        return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
    }

    private getOne(field: string, id: number | string): Promise<UserEntity[]> {
        return new Promise((resolve, reject) => {
            this.database.query(`
                SELECT ${this.usersTable}.id,
                       ${this.usersTable}.username,
                       ${this.usersTable}.email,
                       ${this.usersTable}.password,
                       ${this.usersTable}.enabled,
                       ${this.usersTable}.secret,
                       ${this.usersTable}.gravatar,
                       ${this.usersTable}.password_reset_token,
                       ${this.usersTable}.password_reset_expires,
                       ${this.usersTable}.created,
                       ${this.usersTable}.updated,
                       ${this.usersTable}.removed,
                       array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL)    ${this.rolesTable},
                       array_remove(ARRAY_AGG(${this.accountsTable}.id), NULL) ${this.accountsTable}
                FROM ${this.usersTable}
                         LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}.id)
                         LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)

                         LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.user_id = ${this.usersTable}.id)
                         LEFT JOIN ${this.accountsTable} ON (${this.accountsTable}.id = ${this.userAccountTable}.account_id)

                WHERE ${this.usersTable}."${field}" = $1
                GROUP BY ${this.usersTable}.id;`, [id])
                .then((result) => {
                    const users = result.rows.map(row => {
                        return new UserEntity(
                            row.id,
                            row.username,
                            row.email,
                            row.password,
                            row.enabled,
                            row.secret,
                            row.gravatar,
                            row.password_reset_token,
                            row.password_reset_expires,
                            row.created,
                            row.updated,
                            row.removed,
                            row.roles,
                            row.accounts);
                    });
                    resolve(users);
                })
                .catch(e => reject(e));
        });
    }

    public getByUsername(username: string): Promise<UserEntity>  {
        // transform array to one entity
        return new Promise((resolve, reject) => {
            this.getOne("username", username)
                .then((users: UserEntity[]) => {
                    if (users.length > 0) {
                        resolve(users[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    public getByPasswordResetToken(token: string): Promise<UserEntity> {
        return new Promise((resolve, reject) => {
            this.database.query(`
                SELECT ${this.usersTable}.id,
                       ${this.usersTable}.username,
                       ${this.usersTable}.email,
                       ${this.usersTable}.password,
                       ${this.usersTable}.enabled,
                       ${this.usersTable}.secret,
                       ${this.usersTable}.gravatar,
                       ${this.usersTable}.password_reset_token,
                       ${this.usersTable}.password_reset_expires,
                       ${this.usersTable}.created,
                       ${this.usersTable}.updated,
                       ${this.usersTable}.removed,
                       array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL) ${this.rolesTable},
                       array_remove(ARRAY_AGG(${this.accountsTable}.id), NULL) ${this.accountsTable}
                FROM ${this.usersTable}
                LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}.id)
                LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)
                
                LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.user_id = ${this.usersTable}.id)
                LEFT JOIN ${this.accountsTable} ON (${this.accountsTable}.id = ${this.userAccountTable}.account_id)
                
                WHERE ${this.usersTable}.password_reset_token = $1
                AND    ${this.usersTable}.password_reset_expires >= FLOOR(EXTRACT(epoch FROM NOW()) * 1000)
                GROUP BY ${this.usersTable}.id;`, [token])
            .then((result) => {
                const users = result.rows.map(row => {
                    return new UserEntity(
                        row.id,
                        row.username,
                        row.email,
                        row.password,
                        row.enabled,
                        row.secret,
                        row.gravatar,
                        row.password_reset_token,
                        row.password_reset_expires,
                        row.created,
                        row.updated,
                        row.removed,
                        row.roles,
                        row.accounts);
                });
                if (users.length === 1) {
                    resolve(users[0]);
                } else {
                    resolve(null);
                }
            })
                .catch(e => reject(e));

        });
    }

    /**
     * get all users
     */
    public get(): Promise<UserEntity[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                    SELECT ${this.usersTable}.id,
                           ${this.usersTable}.username,
                           ${this.usersTable}.email,
                           ${this.usersTable}.password,
                           ${this.usersTable}.enabled,
                           ${this.usersTable}.secret,
                           ${this.usersTable}.gravatar,
                           ${this.usersTable}.password_reset_token,
                           ${this.usersTable}.password_reset_expires,
                           ${this.usersTable}.created,
                           ${this.usersTable}.updated,
                           ${this.usersTable}.removed,
                           array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL) ${this.rolesTable},
                           array_remove(ARRAY_AGG(${this.accountsTable}.id), NULL) ${this.accountsTable}
                    FROM ${this.usersTable}
                    LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}.id)
                    LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)
                    
                    LEFT JOIN ${this.userAccountTable} ON (${this.userAccountTable}.user_id = ${this.usersTable}.id)
                    LEFT JOIN ${this.accountsTable} ON (${this.accountsTable}.id = ${this.userAccountTable}.account_id)
                    
                    GROUP BY ${this.usersTable}.id
                    ORDER BY ${this.usersTable}.id;`);

                resolve(result.rows.map(row => {
                    return new UserEntity(
                        row.id,
                        row.username,
                        row.email,
                        row.password,
                        row.enabled,
                        row.secret,
                        row.gravatar,
                        row.password_reset_token,
                        row.password_reset_expires,
                        row.created,
                        row.updated,
                        row.removed,
                        row.roles,
                        row.accounts);
                }));
            } catch (e) {
                reject(e);
            }
        });
    }

    public getById(id: number): Promise<UserEntity> {
        // transform array to one entity
        return new Promise((resolve, reject) => {
            this.getOne("id", id)
                .then((users: UserEntity[]) => {
                    if (users.length > 0) {
                        resolve(users[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    public getByName(email: string): Promise<UserEntity> {
        // transform array to one entity
        return new Promise((resolve, reject) => {
            this.getOne("email", email)
                .then((users: UserEntity[]) => {
                    if (users.length > 0) {
                        resolve(users[0]);
                    } else {
                        resolve(null);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    /**
     * Save user to database.
     *
     * @param user
     * @param createFirstUser
     */
    public create(user: UserEntity, createFirstUser: boolean = false): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.database.query(
                    `INSERT INTO ${this.usersTable} ("username", "email", "gravatar", "password" , "enabled") VALUES ($1, $2, $3, $4, $5)`,
                    [
                        user.username,
                        user.email,
                        this.gravatar(user.email),
                        await Service.hash(user.password),
                        true
                    ]
                );
                const _user = await this.getByName(user.email);
                // add superadmin role
                try {
                    let roleId = 3;
                    switch (_user.id) {
                        case 1:
                            roleId = 1;
                            break;
                        case 2:
                            roleId = 2;
                            break;
                        default:
                            roleId = 3;
                    }
                    if (_user.username.includes("user")) {
                        roleId = 3;
                    }
                    if (_user.username.includes("manager")) {
                        roleId = 4;
                    }
                    await this.database.query(`
                        INSERT INTO ${this.userRoleTable}
                            SELECT u.id, r.id
                            FROM ${this.usersTable} u
                              LEFT JOIN ${this.rolesTable} r
                                ON r.id = $1
                            WHERE u.id = $2`, [
                                roleId, _user.id
                            ]);

                } catch (e) {
                    reject(e);
                }
                resolve(_user);
            } catch (e) {
                reject(e);
            }
        });
    }

    public update(user: UserEntity): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
            // use multiple try catch to monitor error for every db request
            try {
                if (user.id === ROOT_ID && !!user.enabled === false) {
                    throw new Error(`${user.username} cannot be disabled`);
                }
                try {
                    await this.database.query(
                        `UPDATE ${this.usersTable}
                     SET username = $2,
                         email = $3,
                         password = $4,
                         enabled = $5,
                         secret = $6,
                         gravatar = $7,
                         password_reset_token = $8,
                         password_reset_expires = $9,
                         removed = $10
                         WHERE id = $1 RETURNING *;`,
                        [
                            user.id,
                            user.username,
                            user.email,
                            user.password,
                            !!user.enabled,
                            user.secret,
                            user.gravatar,
                            user.passwordResetToken,
                            user.passwordResetExpires,
                            user.removed
                        ]
                    );
                } catch (e) {
                    throw e;
                }
                try {
                    if (user.roles) {
                        await this.database.query(`
                            DELETE FROM ${this.userRoleTable}
                            WHERE user_id = $1`, [
                                user.id
                            ]);
                        await Promise.all(user.roles.map(async(roleId) => {
                            await this.database.query(`
                                INSERT INTO ${this.userRoleTable}
                                SELECT u.id, r.id
                                FROM ${this.usersTable} u
                                     LEFT JOIN ${this.rolesTable} r ON r.id = $1
                                WHERE u.id = $2`, [
                                roleId ? roleId : USER_ROLE_ID, user.id
                            ]);
                        }));
                    }
                } catch (e) {
                    throw e;
                }
                try {
                    if (user.accounts) {
                        await this.database.query(`
                            DELETE FROM ${this.userAccountTable}
                            WHERE user_id = $1`, [
                            user.id
                        ]);
                        await Promise.all(user.accounts.map(async(accountId) => {
                            if (accountId) {
                                await this.database.query(`
                                INSERT INTO ${this.userAccountTable}
                                SELECT u.id, a.id
                                FROM ${this.usersTable} u
                                         LEFT JOIN ${this.accountsTable} a ON a.id = $1
                                WHERE u.id = $2`, [
                                    accountId, user.id
                                ]);
                            }
                        }));
                    }
                } catch (e) {
                    throw e;
                }
                resolve(this.getById(user.id));
            } catch (e) {
                reject(e);
            }
        });
    }

    public remove(user: UserEntity): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                if (user.id === ROOT_ID) {
                    throw new Error(`${user.username} cannot be deleted`);
                }
                try {
                    await this.database.query(`
                        DELETE
                        FROM ${this.userRoleTable}
                        WHERE user_id = $1`, [
                        user.id
                    ]);
                } catch (e) {
                    throw e;
                }
                try {
                    await this.database.query(`
                        DELETE
                        FROM ${this.userAccountTable}
                        WHERE user_id = $1`, [
                        user.id
                    ]);
                } catch (e) {
                    throw e;
                }
                try {
                    if (process.env.NODE_ENV === "test") {
                        await this.database.query(
            `DELETE FROM ${this.usersTable}
                                 WHERE id = $1;`,
                            [
                                user.id
                            ]
                        );
                    } else {
                        await this.database.query(
                            `UPDATE ${this.usersTable}
                         SET removed = NOW(),
                             enabled = FALSE
                             WHERE id = $1 RETURNING *;`,
                            [
                                user.id
                            ]
                        );
                    }
                } catch (e) {
                    throw e;
                }
                user.removed = new Date();
                user.enabled = false;
                resolve(user);
            } catch (e) {
                reject(e);
            }
        });
    }
}
