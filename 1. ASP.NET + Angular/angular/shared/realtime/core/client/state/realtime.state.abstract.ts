import { IRealtimeClientInternal } from "../internal";
import { ConnectionState } from "../../../abstract";

// GOF pattern: State
export interface IRealtimeClientState {
    readonly stateName: string;
    readonly connectionState: ConnectionState;

    triggerStateEvent(): void;

    setContext(client: IRealtimeClientInternal): void;

    starting(): void;
    stopping(): void;
    stopped(): void;

    connecting(): void;
    reconnecting(): void;
    connected(): void;

    error(error: Error): void;
    retryBackoff(error: Error): void;
}
