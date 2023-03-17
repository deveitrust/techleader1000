import { Injectable, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import {
    ConnectionState,
    IRealtimeClient,
    IRealTimeConnectionOptions,
    RealTimeConnectionBuilder
} from '../../abstract';
import { RealtimeClientInternal } from './internal';

@Injectable()
export class RealtimeClient implements IRealtimeClient, OnDestroy {
    private internal: RealtimeClientInternal;
    
    constructor(
        builder: RealTimeConnectionBuilder
    ) {
        this.internal = new RealtimeClientInternal(builder);
    }

    ngOnDestroy(): void {
        this.internal.ngOnDestroy();
        this.internal = null;
    }

    get starting$(): Observable<IRealtimeClient> {
        return this.internal.starting$;
    }
    get stopping$(): Observable<IRealtimeClient> {
        return this.internal.stopping$;
    }
    get stopped$(): Observable<IRealtimeClient>{
        return this.internal.stopped$;
    }

    get connecting$(): Observable<IRealtimeClient>{
        return this.internal.connecting$;
    }
    get reconecting$(): Observable<IRealtimeClient> {
        return this.internal.reconecting$;
    }
    get connected$(): Observable<IRealtimeClient> {
        return this.internal.connected$;
    }
    get connection$(): Observable<IRealtimeClient> {
        return this.internal.connection$;
    }

    get error$(): Observable<Error> {
        return this.internal.error$;
    }

    get connectionState(): ConnectionState {
        return this.internal.connectionState;
    }
    get connectionState$(): Observable<ConnectionState> {
        return this.internal.connectionState$;
    }

    start(connectionUrl: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient> {
        return this.internal.start(connectionUrl, options);
    }

    restart(connectionUrl?: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient> {
        return this.internal.restart(connectionUrl, options);
    }

    stop(): Observable<void> {
        return this.internal.stop();
    }

    send(methodName: string, ...args: any[]): Observable<void> {
        return this.internal.send(methodName, ...args);
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.internal.invoke<T>(methodName, ...args);
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        return this.internal.on(methodName, newMethod);
    }

    off(): void;
    off(methodName: string): void;
    off(methodName: string, method: (...args: any[]) => void): void;
    off(methodName?: any, method?: any) {
        return this.internal.off(methodName, method);
    }
}
