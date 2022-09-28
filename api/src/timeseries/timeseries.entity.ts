import {Service} from "../services/app.service";
import {
  POSTGRES_SERVICE,
  TIMESERIES_REPOSITORY,
} from "../services/app.constants";
import {IPostgresFactory} from "../infrastructure/database/postgres/factory/postgres.factory.interface";
import {ITimeSeriesServiceRepository} from "../infrastructure/database/postgres/interface/timeseries.repository.interface";

export class TimeSeriesEntity {
  public  save: () => Promise<TimeSeriesEntity>;
  public  remove: () => Promise<TimeSeriesEntity>;

  constructor(
    public readonly taskId: number,
    public readonly value: number,
    public readonly text?: string,
    public readonly created?:  Date,
    public readonly updated?:  Date,
    public          removed?:  Date,
  ) {
    this.save = function (): Promise<TimeSeriesEntity> {
      return Service.getRepository<ITimeSeriesServiceRepository>(TIMESERIES_REPOSITORY).create(this);
    };

    const table = Service.getService<IPostgresFactory>(POSTGRES_SERVICE).tables.TIMESERIES_TABLE;

    this.remove = function (): Promise<TimeSeriesEntity> {
      return Service.getRepository<ITimeSeriesServiceRepository>(TIMESERIES_REPOSITORY)
        .remove<TimeSeriesEntity>(this, table);
    };
  }
}
