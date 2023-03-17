import { IRealTimeConnection } from "./realtime.connection";
import { IRealTimeConnectionOptions } from "./realtime.connection.options";

export interface IRealTimeConnectionBuilder {
    build(): IRealTimeConnection;
    withUrl(url: string, options: IRealTimeConnectionOptions): IRealTimeConnectionBuilder;
}

export abstract class RealTimeConnectionBuilder implements IRealTimeConnectionBuilder {
    abstract build(): IRealTimeConnection;
    abstract withUrl(url: string, options: IRealTimeConnectionOptions): IRealTimeConnectionBuilder;
}
