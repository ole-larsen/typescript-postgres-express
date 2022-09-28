import {Pool} from "pg";
import {IPostgresFactory} from "./postgres.factory.interface";

export class PostgresFactory {

  static SetupRDBMS(connectionString: string): IPostgresFactory {
    return {
      client: new Pool({
        connectionString: connectionString
      }),
      tables: {
        ROLES_TABLE: "roles",
        USERS_TABLE: "users",
        USER_ROLE_TABLE: "user_role",
        ACCOUNTS_TABLE: "accounts",
        USER_ACCOUNT_TABLE: "user_account",
        TASKS_TABLE: "tasks",
        TIMESERIES_TABLE: "timeseries"
      }
    };
  }
}
