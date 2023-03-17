// All states in one file to avoid cyrular dependencies
import { ConnectionState } from "../../../abstract";
import { RealtimeClientState } from "./realtime.state";

abstract class RealtimeClientErrorState extends RealtimeClientState {
    error(error: Error): void {
        this.transitionTo(new ErrorState());
        this.client.errorSubject.next(error);
    }
}

export class StartingState extends RealtimeClientState {
    readonly stateName = nameof(StartingState);
    readonly connectionState = ConnectionState.Starting;

    triggerStateEvent(): void {
        this.client.startingSubject.next(this.client);
    }

    connecting(): void {
        this.transitionTo(new ConnectingState());
    }
}

export class StoppingState extends RealtimeClientState {
    readonly stateName = nameof(StoppingState);
    readonly connectionState = ConnectionState.Stopping;

    triggerStateEvent(): void {
        this.client.stoppingSubject.next(this.client);
    }

    stopped(): void {
        this.transitionTo(new StoppedState());
    }
}

export class StoppedState extends RealtimeClientState {
    readonly stateName = nameof(StoppedState);
    readonly connectionState = ConnectionState.Stopped;

    triggerStateEvent(): void {
        this.client.stoppedSubject.next(this.client);
    }

    starting(): void {
        this.transitionTo(new StartingState());
    }
}

export class ConnectingState extends RealtimeClientErrorState {
    readonly stateName = nameof(ConnectingState);
    readonly connectionState = ConnectionState.Connecting;

    triggerStateEvent(): void {
        this.client.connectingSubject.next(this.client);
    }

    connected(): void {
        this.transitionTo(new ConnectedState());
    }

    stopping(): void {
        this.transitionTo(new StoppingState());
    }

    retryBackoff(error: Error): void {
        this.transitionTo(new RetryBackoffState());
        this.client.errorSubject.next(error);
    }
}

export class ReconnectingState extends RealtimeClientErrorState {
    readonly stateName = nameof(ReconnectingState);
    readonly connectionState = ConnectionState.Reconnecting;

    triggerStateEvent(): void {
        this.client.reconectingSubject.next(this.client);
    }

    connecting(): void {
        this.transitionTo(new ConnectingState());
    }

    stopping(): void {
        this.transitionTo(new StoppingState());
    }
}

export class ConnectedState extends RealtimeClientErrorState {
    readonly stateName = nameof(ConnectedState);
    readonly connectionState = ConnectionState.Connected;

    triggerStateEvent(): void {
        this.client.connectedSubject.next(this.client);
    }

    stopping(): void {
        this.transitionTo(new StoppingState());
    }
}

export class ErrorState extends RealtimeClientState {
    readonly stateName = nameof(ErrorState);
    readonly connectionState = ConnectionState.Error;

    starting(): void {
        this.transitionTo(new StartingState());
    }

    connecting(): void {
        this.clearError();
        this.transitionTo(new ConnectingState());
    }

    reconnecting(): void {
        this.clearError();
        this.transitionTo(new ReconnectingState());
    }

    stopping(): void {
        this.clearError();
        this.transitionTo(new StoppingState());
    }

    retryBackoff(error: Error): void {
        this.clearError();
        this.transitionTo(new RetryBackoffState());
    }

    private clearError() {
        this.client.errorSubject.next(null);
    }
}

export class RetryBackoffState extends RealtimeClientErrorState {
    readonly stateName = nameof(RetryBackoffState);
    readonly connectionState = ConnectionState.RetryBackoff;

    connecting(): void {
        this.clearError();
        this.transitionTo(new ConnectingState());
    }

    stopping(): void {
        this.clearError();
        this.transitionTo(new StoppingState());
    }

    reconnecting(): void {
        this.clearError();
        this.transitionTo(new ReconnectingState());
    }

    private clearError() {
        this.client.errorSubject.next(null);
    }
}
