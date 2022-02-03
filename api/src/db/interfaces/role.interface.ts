import { RoleEntity } from "../entities/roles.entity";

/**
 * Role Service interface for binding
 */
export interface IRoleServiceRepository {
    get(): Promise<RoleEntity[]>
    getByEnabled(enabled: boolean): Promise<RoleEntity[]>
    getById(id: number): Promise<RoleEntity>
    getByName(title: string): Promise<RoleEntity>

    update(role: RoleEntity): Promise<RoleEntity>
    create(role: RoleEntity): Promise<RoleEntity>
    remove(role: RoleEntity): Promise<RoleEntity>
}
