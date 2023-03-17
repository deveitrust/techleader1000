import { InvalidOperationException } from "@custom/shared/exceptions";
import { IRealtimeClientInternal } from "../internal";
import { IRealtimeClientState } from "./realtime.state.abstract";
import { ConnectionState } from "../../../abstract";

// GOF pattern: State
export abstract class RealtimeClientState implements IRealtimeClientState {
    abstract readonly stateName: string;
    abstract readonly connectionState: ConnectionState;

    triggerStateEvent(): void {
    }

    protected client: IRealtimeClientInternal;
    setContext(client: IRealtimeClientInternal): void {
        this.client = client;
    }

    protected transitionTo(state: IRealtimeClientState): void {
        this.client.transitionTo(state);
    }

    starting(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Starting));
    }

    stopping(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Stopping));
    }

    stopped(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Stopped));
    }

    connecting(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Connecting));
    }

    reconnecting(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Reconnecting));
    }

    connected(): void {
        this.throwInvalidOperation(nameof(ConnectionState.Connected));
    }

    error(error: Error): void {
        this.throwInvalidOperation(nameof(ConnectionState.Error));
    }

    retryBackoff(error: Error): void {
        this.throwInvalidOperation(nameof(ConnectionState.RetryBackoff));
    }

    protected throwInvalidOperation(stateName: string): void {
        throw new InvalidOperationException(
            `Can't transit state from ${this.stateName} to ${stateName}`);
    }
}
