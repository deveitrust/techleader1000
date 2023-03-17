import { Observable } from "rxjs";
import { ConnectionState } from "../realtime.connection.state";
import { IRealTimeConnectionOptions } from "../realtime.connection.options";
import { IRealtimeSimpleClient } from "./realtime.simple.client";

// TODO: rename IRealtimeSimpleClient to be the base,
// and the IRealtimeClient to be the extended version
export interface IRealtimeClient extends IRealtimeSimpleClient {
    readonly starting$: Observable<IRealtimeClient>;
    readonly stopping$: Observable<IRealtimeClient>;
    readonly stopped$: Observable<IRealtimeClient>;

    readonly connecting$: Observable<IRealtimeClient>;
    readonly reconecting$: Observable<IRealtimeClient>;
    readonly connected$: Observable<IRealtimeClient>;

    readonly connection$: Observable<IRealtimeClient>;

    readonly error$: Observable<Error>;

    readonly connectionState: ConnectionState;
    readonly connectionState$: Observable<ConnectionState>;

    start(connectionUrl: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient>;
    restart(connectionUrl?: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient>;
    stop(): Observable<void>;
}
