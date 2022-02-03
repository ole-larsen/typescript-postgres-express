import {UserEntity} from "../entities/users.entity";

/**
 * Role Service interface for binding
 */
export interface IUserServiceRepository {
    get(): Promise<UserEntity[]>
    getById(id: number): Promise<UserEntity>
    getByName(email: string): Promise<UserEntity>
    getByUsername(username: string): Promise<UserEntity>
    getByPasswordResetToken(token: string): Promise<UserEntity>

    create(user: UserEntity, createFirstUser: boolean): Promise<UserEntity>
    update(user: UserEntity): Promise<UserEntity>
    remove(user: UserEntity): Promise<UserEntity>
}

export interface AuthToken {
    accessToken: string;
    kind: string;
}
