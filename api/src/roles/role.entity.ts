import {Service} from "../services/app.service";
import {POSTGRES_SERVICE, ROLE_REPOSITORY} from "../services/app.constants";
import {IRoleServiceRepository} from "../infrastructure/database/postgres/interface/role.repository.interface";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";

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
    public          users?: number[],
  ) {
    this.save = function (): Promise<RoleEntity> {
      return Service.getRepository<IRoleServiceRepository>(ROLE_REPOSITORY).update(this);
    };

    const table = Service.getService<IPostgresFactory>(POSTGRES_SERVICE).tables.ROLES_TABLE;

    this.remove = function (): Promise<RoleEntity> {
      return Service.getRepository<IRoleServiceRepository>(ROLE_REPOSITORY)
        .remove<RoleEntity>(this, table);
    };
  }
}
