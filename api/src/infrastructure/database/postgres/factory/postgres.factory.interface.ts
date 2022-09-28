import {Pool} from "pg";

export interface IPostgresFactory {
  client: Pool;
  tables: {
    [name: string]: string;
  }
}