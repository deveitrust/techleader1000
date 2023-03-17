import {
    ConnectionState,
    IRealtimeClient,
    IRealTimeConnectionOptions
} from '@src/custom/shared/realtime/abstract';
import { Observable } from 'rxjs';

export abstract class RealtimeClientBaseProxy implements IRealtimeClient {
    protected constructor(
        protected readonly realtimeClient: IRealtimeClient
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
        return this.realtimeClient.send(methodName, ...args);
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.realtimeClient.invoke<T>(methodName, ...args);
    }
}
