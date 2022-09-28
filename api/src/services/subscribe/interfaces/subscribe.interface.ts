import nats from "nats";
export interface ISubscribeServiceInterface {
    connect (): Promise<nats.NatsConnection>
    close (): Promise<nats.NatsConnection>
    subscribe (channel: string): void
}