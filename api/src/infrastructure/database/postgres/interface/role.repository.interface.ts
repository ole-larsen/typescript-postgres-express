import { RoleEntity } from "../../../../roles/role.entity";

/**
 * Role Service interfaces for binding
 */
export interface IRoleServiceRepository {
  get(): Promise<RoleEntity[]>
  getById(id: number): Promise<RoleEntity>
  getByName(title: string): Promise<RoleEntity>

  update(entity: RoleEntity): Promise<RoleEntity>
  create(entity: RoleEntity): Promise<RoleEntity>
  remove<T extends RoleEntity>(entity: T, table: string): Promise<T>
}
