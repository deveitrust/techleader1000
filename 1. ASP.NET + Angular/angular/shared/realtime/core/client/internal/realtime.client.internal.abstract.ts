import { ConnectionState, IRealtimeClient } from '../../../abstract';
import { IRealtimeClientState } from '../state/realtime.state.abstract';
import { BehaviorSubject } from 'rxjs';

// needed to expose methods only to state objects, NOT to everyone
export interface IRealtimeClientInternal extends IRealtimeClient {
    //error: Error;
    connectionState: ConnectionState;
    transitionTo(state: IRealtimeClientState): void;

    startingSubject: BehaviorSubject<IRealtimeClient>;
    stoppingSubject: BehaviorSubject<IRealtimeClient>;
    stoppedSubject: BehaviorSubject<IRealtimeClient>;
    connectingSubject: BehaviorSubject<IRealtimeClient>;
    reconectingSubject: BehaviorSubject<IRealtimeClient>;
    connectedSubject: BehaviorSubject<IRealtimeClient>;
    errorSubject: BehaviorSubject<Error>;
}
