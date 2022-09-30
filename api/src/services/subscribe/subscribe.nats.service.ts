import nats, {connect, StringCodec} from "nats";
import {Service} from "../app.service";
import {Config} from "../../infrastructure/util/secrets";
import {
  CONFIG_SERVICE, LOGGER_SERVICE,
} from "../app.constants";
import {
  ISubscribeServiceInterface
} from "./interfaces/subscribe.interface";

import {NATS_CONNECTION_NAME} from "./subscribe.constants";
import {Logger} from "../../infrastructure/util/logger";

export class SubscribeNatsService implements ISubscribeServiceInterface {
  nc: nats.NatsConnection;
  logger: Logger;

  constructor () {
    this.logger = Service.getService<Logger>(LOGGER_SERVICE);
  }

  async connect (): Promise<nats.NatsConnection> {
    const config = Service.getService<Config>(CONFIG_SERVICE);
    const url    = config.connections.nats.url;
    const token  = config.connections.nats.token;

    try {
      this.nc = await connect({
        servers: url,
        token: token,
        name: NATS_CONNECTION_NAME
      });
      this.logger.debug(`connected to ${this.nc.getServer()}`, { service: "nats" });
      return this.nc;
    } catch (e) {
      throw e;
    }
  }

  async close (): Promise<nats.NatsConnection> {
    try {
      // this promise indicates the client closed
      const done = this.nc.closed();
      // close the connection
      await this.nc.close();
      // check if the close was OK
      const e = await done;
      if (e) {
        throw e;
      }
      return this.nc;
    } catch (e) {
      this.logger.error(e, { service: "nats", message: `error closing connection to ${this.nc.getServer()}` });
      throw e;
    }
  }

  async subscribe (channel: string): Promise<void> {
    const sub = this.nc.subscribe(channel);
    this.logger.debug(`subscribe to ${channel}`, { service: "nats" });

    try {
      for await (const m of sub) {
        this.logger.debug(JSON.parse(StringCodec().decode(m.data)), { service: "nats" });
      }
      await this.nc.drain();
      if (process.env.NODE_ENV === "test") {
        await this.nc.close();
        const done = this.nc.closed();
        const e = await done;
        if (e) {
          this.logger.error(`error closing ${this.nc.getServer()} ${e.message}`, { service: "nats" });
          throw e;
        }
      }
      return;
    } catch (e) {
      this.logger.error(e, { service: "nats" });
      this.close()
        .then(() => {
          this.connect();
        })
        .catch(e => this.logger.error(e, { service: "nats" }));
    }
    this.logger.debug("subscription closed", { service: "nats" });
  }
}