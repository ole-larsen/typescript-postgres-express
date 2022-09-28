export class TimeSeriesMetric {
  constructor(
    public          name: string,
    public          identity: string,
    public readonly value: number,
    public readonly text?: string,
    public readonly created?:  Date,
  ) {}
}
