import {UserEntity} from "../entities/users.entity";

/**
 * Role Service interface for binding
 */
export interface IUserServiceRepository {
    getUsers(): Promise<UserEntity[]>
    getUserById(id: number): Promise<UserEntity>
    getUserByEmail(email: string): Promise<UserEntity>
    getUserByUsername(username: string): Promise<UserEntity>
    getUserByPasswordResetToken(token: string): Promise<UserEntity>

    create(user: UserEntity, createFirstUser: boolean): Promise<UserEntity>
    update(user: UserEntity): Promise<UserEntity>
    remove(user: UserEntity): Promise<UserEntity>
}

export interface AuthToken {
    accessToken: string;
    kind: string;
}
