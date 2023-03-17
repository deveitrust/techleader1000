import { Injectable } from "@angular/core";
import {
    IRealTimeConnection,
    IRealTimeConnectionBuilder,
    RealTimeConnectionBuilder,
    IRealTimeConnectionOptions
} from "../abstract";
import { FakeRealTimeConnection } from "./realtime.connection.fake";

@Injectable()
export class FakeRealTimeConnectionBuilder extends RealTimeConnectionBuilder {
    constructor(
        private readonly connection: FakeRealTimeConnection
    ) {
        super();
    }

    build(): IRealTimeConnection {
        return this.connection;
    }

    withUrl(url: string, options: IRealTimeConnectionOptions): IRealTimeConnectionBuilder {
        return this;
    }
}
