import {Service} from "../../services/app.service";
import {ACCOUNT_REPOSITORY_SERVICE} from "../../services/constants";
import {AccountRepository} from "../storage/postgres/repository/account.repository";

export class AccountEntity {
    public save: () => Promise<AccountEntity>;
    public remove: () => Promise<AccountEntity>;
    constructor(
        public readonly id?: number,
        public          name?: string,
        public          email?: string,
        public          fid?: string,
        public          uid?: string,
        public          customerPortalId?: string,
        public          type?: string,
        public          status?: string,
        public          enabled?: boolean,
        public readonly created?: Date,
        public readonly updated?: Date,
        public          removed?: Date,
        public          users?: number[]
    ) {
        this.save = function (): Promise<AccountEntity> {
            return Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE).update(this);
        };
        this.remove = function (): Promise<AccountEntity> {
            return Service.getService<AccountRepository>(ACCOUNT_REPOSITORY_SERVICE).remove(this);
        };
    }
}
