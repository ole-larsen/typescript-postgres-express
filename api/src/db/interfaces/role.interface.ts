import { RoleEntity } from "../entities/roles.entity";

/**
 * Role Service interface for binding
 */
export interface IRoleServiceRepository {
    getRoles(): Promise<RoleEntity[]>
    getRolesByEnabled(enabled: boolean): Promise<RoleEntity[]>
    getRoleById(id: number): Promise<RoleEntity>
    getRoleByTitle(title: string): Promise<RoleEntity>

    update(role: RoleEntity): Promise<RoleEntity>
    create(role: RoleEntity): Promise<RoleEntity>
    remove(role: RoleEntity): Promise<RoleEntity>
}
