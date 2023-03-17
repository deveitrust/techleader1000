import { Observable, throwError } from 'rxjs';
import { catchError, mergeMap, tap } from 'rxjs/operators';
import { ConnectionState, IRealtimeClient, IRealTimeConnectionOptions } from '../../abstract';

// GOF pattern: Proxy
export class RealtimeClientLoggingProxy implements IRealtimeClient {
    constructor(
        private readonly realtimeClient: IRealtimeClient
    ) {
    }

    starting$ = this.realtimeClient.starting$;
    stopping$ = this.realtimeClient.stopping$;
    stopped$ = this.realtimeClient.stopped$;

    connecting$ = this.realtimeClient.connecting$;
    reconecting$ = this.realtimeClient.reconecting$;
    connected$ = this.realtimeClient.connected$;
    connection$ = this.realtimeClient.connection$;

    get connectionState(): ConnectionState {
        return this.realtimeClient.connectionState;
    }
    connectionState$ = this.realtimeClient.connectionState$;

    error$ = this.realtimeClient.error$;

    start(connectionUrl: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient> {
        return this.realtimeClient.start(connectionUrl, options);
    }

    restart(connectionUrl?: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient> {
        return this.realtimeClient.restart(connectionUrl, options);
    }

    stop(): Observable<void> {
        return this.realtimeClient.stop();
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        return this.realtimeClient.on(methodName, newMethod);
    }

    off(): void;
    off(methodName: string): void;
    off(methodName: string, method: (...args: any[]) => void): void;
    off(methodName?: any, method?: any) {
        return this.realtimeClient.off(methodName, method);
    }

    send(methodName: string, ...args: any[]): Observable<void> {
        return this.execute(methodName, args,
            () => this.realtimeClient.send(methodName, ...args));
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.execute(methodName, args,
            () => this.realtimeClient.invoke<T>(methodName, ...args));
    }

    private execute<T>(methodName: string, args: any, action: () => Observable<T>): Observable<T> {
        const executionKey = Date.now();
        const stream$ = this.connection$.pipe(
            // tap(_ => console.log(`[${methodName}] uid=${executionKey} request:`, args)),
            mergeMap(_ => action()),
            // tap(result => console.log(`[${methodName}] uid=${executionKey} response:`, args, result)),
            catchError(err => {
                console.error(`[${methodName}] uid=${executionKey} error:`, args, err);
                return throwError(err);
            })
        );
        return stream$;
    }
}
