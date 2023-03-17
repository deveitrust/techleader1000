// #region imports
import {
    IRealtimeClient,
    IRealtimeSimpleClient,
    RealtimeClientFactory,
} from '@custom/shared/realtime';
import { Observable } from 'rxjs';
import { mapTo, mergeMap, switchMap, take } from 'rxjs/operators';
// #endregion

export abstract class SimpleRealtimeClient implements IRealtimeSimpleClient {
    protected readonly realtimeClient: IRealtimeClient;
    protected abstract start(): Observable<IRealtimeSimpleClient>;

    protected constructor(
        realtimeClientFactory: RealtimeClientFactory
    ) {
        this.realtimeClient = realtimeClientFactory.create();
    }

    private _connected$: Observable<IRealtimeSimpleClient>;
    protected get connection$(): Observable<IRealtimeSimpleClient> {
        if (!this._connected$) {
            this._connected$ = this.start().pipe(
                switchMap(_ => this.connected$)
            );
        }

        // use take(1) here to avoid caching
        return this._connected$.pipe(
            take(1)
        );
    }

    get connected$(): Observable<IRealtimeSimpleClient> {
        return this.realtimeClient.connected$.pipe(
            mapTo(this.realtimeClient)
        );
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.connection$.pipe(
            mergeMap(client => client.invoke<T>(methodName, ...args))
        );
    }

    send(methodName: string, ...args: any[]): Observable<void> {
        return this.connection$.pipe(
            mergeMap(client => client.send(methodName, ...args))
        );
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        this.realtimeClient.on(methodName, newMethod);
    }

    off(): void;
    off(methodName: string): void;
    off(methodName: string, method: (...args: any[]) => void): void;
    off(methodName?: any, method?: any) {
        this.realtimeClient.off(methodName, method);
    }
}
