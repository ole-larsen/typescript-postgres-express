import {TimeSeriesEntity} from "../../../../timeseries/timeseries.entity";
import {TimeSeriesMetric} from "../../../../timeseries/timeseriesMetrics.entity";

/**
 * Role Service interfaces for binding
 */
export interface ITimeSeriesServiceRepository {
  get(): Promise<TimeSeriesEntity[]>
  getMetrics(): Promise<TimeSeriesMetric[]>
  create(entity: TimeSeriesEntity): Promise<TimeSeriesEntity>
  remove<T extends TimeSeriesEntity>(entity: T, table: string): Promise<T>
}
