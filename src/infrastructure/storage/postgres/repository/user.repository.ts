import {Pool} from "pg";
import {POSTGRES_SERVICE} from "../../../../services/constants";
import {Service} from "../../../../services/app.service";
import {IUserServiceRepository} from "../../../interfaces/user.interface";
import {ROOT_ID, UserEntity} from "../../../entities/users.entity";

import crypto from "crypto";
import {ERROR_NO_USER_FOUND, ROLES_TABLE, USER_ROLE_TABLE, USERS_TABLE} from "./constants.repository";
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

    constructor() {
        this.database = Service.getService<Pool>(POSTGRES_SERVICE);
        this.usersTable = USERS_TABLE;
        this.rolesTable = ROLES_TABLE;
        this.userRoleTable = USER_ROLE_TABLE;
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

    /**
     * get all users
     */
    public getUsers(): Promise<UserEntity[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                    SELECT ${this.usersTable}."id",
                           ${this.usersTable}."username",
                           ${this.usersTable}."email",
                           ${this.usersTable}."password",
                           ${this.usersTable}."enabled",
                           ${this.usersTable}."secret",
                           ${this.usersTable}."gravatar",
                           ${this.usersTable}."passwordResetToken",
                           ${this.usersTable}."passwordResetExpires",
                           ${this.usersTable}."created",
                           ${this.usersTable}."updated",
                           ${this.usersTable}."removed",
                           array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL) ${this.rolesTable}
                    FROM ${this.usersTable}
                    LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}."id")
                    LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)
                    GROUP BY ${this.usersTable}."id"
                    ORDER BY ${this.usersTable}."id";`);
                resolve(result.rows.map(row => {
                    return new UserEntity(
                        row.id,
                        row.username,
                        row.email,
                        row.password,
                        row.enabled,
                        row.secret,
                        row.gravatar,
                        row.passwordResetToken,
                        row.passwordResetExpires,
                        row.created,
                        row.updated,
                        row.removed,
                        row.roles);
                }));
            } catch (e) {
                reject(e);
            }
        });
    }
    private getUser(field: string, id: any): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                    SELECT ${this.usersTable}."id",
                           ${this.usersTable}."username",
                           ${this.usersTable}."email",
                           ${this.usersTable}."password",
                           ${this.usersTable}."enabled",
                           ${this.usersTable}."secret",
                           ${this.usersTable}."gravatar",
                           ${this.usersTable}."passwordResetToken",
                           ${this.usersTable}."passwordResetExpires",
                           ${this.usersTable}."created",
                           ${this.usersTable}."updated",
                           ${this.usersTable}."removed",
                           array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL) ${this.rolesTable}
                    FROM ${this.usersTable}
                    LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}."id")
                    LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)
                    WHERE ${this.usersTable}."${field}" = $1
                    GROUP BY ${this.usersTable}."id";`, [id]);
                const users = result.rows.map(row => {
                    return new UserEntity(
                        row.id,
                        row.username,
                        row.email,
                        row.password,
                        row.enabled,
                        row.secret,
                        row.gravatar,
                        row.passwordResetToken,
                        row.passwordResetExpires,
                        row.created,
                        row.updated,
                        row.removed,
                        row.roles);
                });
                if (users.length === 1) {
                    resolve(users[0]);
                } else {
                    resolve(null);
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    public getUserById(id: number): Promise<UserEntity> {
        return this.getUser("id", id);
    }

    public getUserByEmail(email: string): Promise<UserEntity> {
        return this.getUser("email", email);
    }

    public getUserByUsername(username: string): Promise<UserEntity>  {
        return this.getUser("username", username);
    }

    public getUserByPasswordResetToken(token: string): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await this.database.query(`
                    SELECT ${this.usersTable}."id",
                           ${this.usersTable}."username",
                           ${this.usersTable}."email",
                           ${this.usersTable}."password",
                           ${this.usersTable}."enabled",
                           ${this.usersTable}."secret",
                           ${this.usersTable}."gravatar",
                           ${this.usersTable}."passwordResetToken",
                           ${this.usersTable}."passwordResetExpires",
                           ${this.usersTable}."created",
                           ${this.usersTable}."updated",
                           ${this.usersTable}."removed",
                           array_remove(ARRAY_AGG(${this.rolesTable}.id), NULL) ${this.rolesTable}
                    FROM ${this.usersTable}
                    LEFT JOIN ${this.userRoleTable} ON (${this.userRoleTable}.user_id = ${this.usersTable}."id")
                    LEFT JOIN ${this.rolesTable} ON (${this.rolesTable}.id = ${this.userRoleTable}.role_id)
                    WHERE ${this.usersTable}."passwordResetToken" = $1
                    AND    ${this.usersTable}."passwordResetExpires" >= FLOOR(EXTRACT(epoch FROM NOW()) * 1000)
                    GROUP BY ${this.usersTable}."id";`, [token]);
                const users = result.rows.map(row => {
                    return new UserEntity(
                        row.id,
                        row.username,
                        row.email,
                        row.password,
                        row.enabled,
                        row.secret,
                        row.gravatar,
                        row.passwordResetToken,
                        row.passwordResetExpires,
                        row.created,
                        row.updated,
                        row.removed,
                        row.roles);
                });
                if (users.length === 1) {
                    resolve(users[0]);
                } else {
                    resolve(null);
                }
            } catch (e) {
                reject(e);
            }
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
                const _user = await this.getUserByEmail(user.email);
                // add superadmin role
                try {
                    await this.database.query(`
                        INSERT INTO ${this.userRoleTable}
                            SELECT u.id, r.id
                            FROM ${this.usersTable} u
                              LEFT JOIN ${this.rolesTable} r
                                ON r.id = $1
                            WHERE u.id = $2`, [
                                createFirstUser ? 1 : 3, _user.id
                            ]);

                } catch (e) {
                    console.log(e);
                }
                resolve(_user);
            } catch (e) {
                reject(e);
            }
        });
    }

    public update(user: UserEntity): Promise<UserEntity> {
        return new Promise(async (resolve, reject) => {
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
                         "passwordResetToken" = $8,
                         "passwordResetExpires" = $9,
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
                resolve(this.getUserById(user.id));
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
                    await this.database.query(
                        `UPDATE ${this.usersTable}
                         SET removed = NOW(),
                             enabled = FALSE
                             WHERE id = $1 RETURNING *;`,
                        [
                            user.id
                        ]
                    );
                } catch (e) {
                    throw e;
                }
                resolve(this.getUserById(user.id));
            } catch (e) {
                reject(e);
            }
        });
    }
}
