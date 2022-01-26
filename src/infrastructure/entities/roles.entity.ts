import {Service} from "../../services/app.service";
import {ROLE_REPOSITORY_SERVICE} from "../../services/constants";
import {RoleRepository} from "../storage/postgres/repository/role.repository";

export const SUPERADMIN_ROLE_ID = 1;
export const ADMIN_ROLE_ID = 2;
export const USER_ROLE_ID = 3;

export class RoleEntity {
    public save: () => Promise<RoleEntity>;
    public remove: () => Promise<RoleEntity>;
    constructor(
        public readonly id?: number,
        public          title?: string,
        public          description?: string,
        public          enabled?: boolean,
        public readonly created?: Date,
        public readonly updated?: Date,
        public          removed?: Date,
        public          users?: string[],
    ) {
        this.save = function (): Promise<RoleEntity> {
            return Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE).update(this);
        };
        this.remove = function (): Promise<RoleEntity> {
            return Service.getService<RoleRepository>(ROLE_REPOSITORY_SERVICE).remove(this);
        };
    }
}
