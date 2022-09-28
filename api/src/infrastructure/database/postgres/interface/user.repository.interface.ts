import {UserEntity} from "../../../../users/user.entity";

/**
 * Role Service interfaces for binding
 */
export interface IUserServiceRepository {
  get(): Promise<UserEntity[]>
  getById(id: number): Promise<UserEntity>
  getByEmail(email: string): Promise<UserEntity>
  getByName(username: string): Promise<UserEntity>
  getByUsername(username: string): Promise<UserEntity>
  getByPasswordResetToken(token: string): Promise<UserEntity>

  create(entity: UserEntity): Promise<UserEntity>
  update(entity: UserEntity): Promise<UserEntity>
  remove<T extends UserEntity>(entity: T, table: string): Promise<T>
}

export interface AuthToken {
  accessToken: string;
  kind: string;
}
