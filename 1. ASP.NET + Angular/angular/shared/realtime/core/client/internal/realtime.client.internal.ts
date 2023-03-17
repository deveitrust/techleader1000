import { OnDestroy } from '@angular/core';
import {
    ArgumentException,
    InternalErrorException, IOException, ObjectAlreadyExistException,
    TimeoutException
} from '@custom/shared/exceptions';
import { run } from '@custom/shared/rxjs';
import { retryBackoff } from 'backoff-rxjs';
import { BehaviorSubject, merge, Observable, of, ReplaySubject, Subscription, throwError, timer } from 'rxjs';
import { catchError, concatMap, filter, map, mergeMap, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import {
    ConnectionState,
    IRealtimeClient,
    IRealTimeConnection,
    IRealTimeConnectionBuilder,
    IRealTimeConnectionOptions
} from '../../../abstract';
import { RealTimeConnectionOptions } from '../../realtime.connection.options';
import { IRealtimeClientState, StoppedState } from '../state';
import { IRealtimeClientInternal } from './realtime.client.internal.abstract';

export class RealtimeClientInternal implements IRealtimeClientInternal, OnDestroy {
    private subscription: Subscription;
    private connectionUrl: string;
    private connection: IRealTimeConnection;
    
    constructor(
        private readonly builder: IRealTimeConnectionBuilder
    ) {
        this.subscribe();
        this.state = new StoppedState();
    }

    ngOnDestroy(): void {
        this.unsubscribe();
    }

    // #region subscribe/unsubscribe
    private subscribe() {
        this.subscription = merge(
            this.autoReconnect$
        ).subscribe();
    }

    private unsubscribe() {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
    // #endregion

    // #region connection options
    private connectionOptions = RealTimeConnectionOptions.defaults;
    private setConnectionOptions(options?: Partial<IRealTimeConnectionOptions>) {
        this.connectionOptions = new RealTimeConnectionOptions(options);
    }

    get enableTracing(): boolean {
        return this.connectionOptions.enableTracing || false;
    }

    get autoReconnect(): boolean {
        return this.connectionOptions.autoReconnect || false;
    }

    get reconnectTimeout(): number {
        return this.connectionOptions.reconnectTimeout || 0;
    }

    get retryCount(): number {
        return this.connectionOptions.retryCount || 0;
    }
    // #endregion

    // #region connection state
    private _state: IRealtimeClientState;
    private set state(value: IRealtimeClientState) {
        this._state = value;
        this._state.setContext(this);
        this.triggerConnectionStateChange(value.connectionState);
    }
    private get state(): IRealtimeClientState {
        return this._state;
    }

    transitionTo(state: IRealtimeClientState): void {
        this.trace(`transition from ${this.state.stateName} to ${state.stateName}`);
        this.state = state;
        this.state.triggerStateEvent();
    }

    get connectionState(): ConnectionState {
        return this.state.connectionState;
    }
    // #endregion

    // #region events
    readonly startingSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly starting$ = this.startingSubject.asObservable().pipe(
        filter(_ => this.isStarting)
    );
    get isStarting(): boolean {
        return this.connectionState === ConnectionState.Starting;
    }

    readonly stoppingSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly stopping$ = this.stoppingSubject.asObservable().pipe(
        filter(_ => this.isStopping)
    );
    get isStopping(): boolean {
        return this.connectionState === ConnectionState.Stopping;
    }

    readonly stoppedSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly stopped$ = this.stoppedSubject.asObservable().pipe(
        filter(_ => this.isStopped)
    );
    get isStopped(): boolean {
        return this.connectionState === ConnectionState.Stopped;
    }

    readonly connectingSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly connecting$ = this.connectingSubject.asObservable().pipe(
        filter(_ => this.isConnecting)
    );
    get isConnecting(): boolean {
        return this.connectionState === ConnectionState.Connecting;
    }

    readonly reconectingSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly reconecting$ = this.reconectingSubject.asObservable().pipe(
        filter(_ => this.isReconnecting)
    );
    get isReconnecting(): boolean {
        return this.connectionState === ConnectionState.Reconnecting;
    }

    readonly connectedSubject: BehaviorSubject<IRealtimeClient> = new BehaviorSubject<IRealtimeClient>(this);
    readonly connected$ = this.connectedSubject.asObservable().pipe(
        filter(_ => this.isConnected)
    );
    get isConnected(): boolean {
        return this.connectionState === ConnectionState.Connected;
    }

    readonly connection$ = this.connected$.pipe(
        take(1)
    );

    readonly errorSubject: BehaviorSubject<Error> = new BehaviorSubject<Error>(null);
    readonly error$ = this.errorSubject.asObservable().pipe(
        filter(error => !!error)
    );
    private get error(): Error {
        return this.errorSubject.value;
    }
    private set error(error: Error) {
        this.errorSubject.next(error);
    }
    private clearError(): void {
        this.error = null;
    }

    private readonly connectionStateSubject: ReplaySubject<ConnectionState> = new ReplaySubject<ConnectionState>(1);
    readonly connectionState$ = this.connectionStateSubject.asObservable();

    private triggerConnectionStateChange(connectionState: ConnectionState): void {
        this.connectionStateSubject.next(connectionState);
    }
    // #endregion

    // #region reconnect
    private autoReconnect$ = this.error$.pipe(
        filter(_ => this.autoReconnect),
        switchMap(_ => timer(this.reconnectTimeout)),
        // can be changed during timeout, so check again
        filter(_ => this.autoReconnect),
        switchMap(_ => this.reconnect()),
        // ignore all errors
        catchError(_ => of(void 0))
    );

    private reconnect(): Observable<IRealtimeClient> {
        const stream$ = of(this).pipe(
            tap(_ => this.reconnecting()),
            switchMap(_ => this.connect())
        )
        return stream$;
    }

    private reconnecting(): void {
        this.state.reconnecting();
    }
    // #endregion

    // #region start/stop/restart
    start(connectionUrl: string, options?: Partial<IRealTimeConnectionOptions>): Observable<IRealtimeClient> {
        if (!connectionUrl) {
            throw new ArgumentException(nameof(connectionUrl));
        }

        const stream$ = of(this).pipe(
            tap(_ => this.starting()),
            tap(_ => this.connectionUrl = connectionUrl),
            tap(_ => this.setConnectionOptions(options)),
            switchMap(_ => this.connect()),
            catchError(err => {
                this.trace(`${nameof(this.start)}`, err);
                return throwError(err);
            }),
            shareReplay(1)
        );
        return stream$;
    }

    private starting() {
        this.state.starting();
    }

    stop(): Observable<void> {
        if (this.isStopped) {
            return of();
        }

        const stream$ = of(this).pipe(
            tap(_ => this.stopping()),
            switchMap(_ => this.connection.stop()),
            tap(_ => this.stopped()),
            catchError(err => {
                this.trace(`${nameof(this.stop)}`, err);
                return throwError(err);
            }),
            shareReplay(1)
        )
        return stream$;
    }

    private stopping(): void {
        this.state.stopping();
    }

    private stopped(): void {
        this.state.stopped();
    }

    restart(connectionUrl?: string, options?: Partial<IRealTimeConnectionOptions>)
        : Observable<IRealtimeClient> {
        options = options || this.connectionOptions;
        connectionUrl = connectionUrl || this.connectionUrl;

        const stream$ = of(this).pipe(
            concatMap(_ => this.stop()),
            concatMap(_ => this.start(connectionUrl, options)),
            shareReplay(1)
        )
        return stream$;
    }
    // #endregion

    // #region connection
    private connect(): Observable<IRealtimeClient> {
        const stream$ = of(this).pipe(
            tap(() => this.clearError()),

            // create connection here, as when using websockets and during reconnecting
            // we need to create new connection again as there is not possible to connect
            // with existing created connection object
            tap(() => this.createConnection()),
            tap(() => this.registerHandlers()),

            tap(_ => this.connecting()),

            switchMap(_ => this.connection.start()),
            
            retryBackoff({
                resetOnSuccess: true,
                maxRetries: this.retryCount,
                maxInterval: this.reconnectTimeout,
                initialInterval: this.reconnectTimeout,
                shouldRetry: error => {
                    // TODO: add additional login to whether a retry should be performed before maxRetries are hit
                    if (!this.autoReconnect) {
                        return false;
                    }

                    error = new IOException(
                        `connection error ${this.connectionUrl}`, error);

                    this.trace(`${nameof(retryBackoff)}`, error);
                    this.retryBackoff(error);

                    return true;
                }
            }),

            catchError(error => {
                // TODO: at this point all efforts to connect to hub have failed.
                // For example, Internet connection is broken or hub is not accessible in any way.
                // So here UI should notify user that the application is not working
                error = new TimeoutException(
                    `Unrecoverable connection error ${this.connectionUrl}`, error);

                this.trace(`${nameof(this.connect)}`, error);
                this.onError(error);

                return throwError(error);
            }),

            tap(_ => this.connected()),

            map(_ => this)
        );
        return stream$;
    }

    private connecting(): void {
        this.state.connecting();
    }

    private onError(error: Error): void {
        if (!error) {
            error = new InternalErrorException(`Unknown error`);
        }
        this.state.error(error);
    }

    private retryBackoff(error: Error): void {
        this.state.retryBackoff(error);
    }

    private connected(): void {
        this.state.connected();
    }

    private createConnection(): void {
        const options = this.connectionOptions;

        const connection = this.builder
            .withUrl(this.connectionUrl, options)
            .build();

        const close$ = connection.close$.pipe(
            tap(error => this.onError(error)),
        );
        run(close$);

        this.connection = connection;
    }
    // #endregion

    // #region send/invoke
    send(methodName: string, ...args: any[]): Observable<void> {
        const stream$ = this.connection$.pipe(
            mergeMap(_ => this.connection.send(methodName, ...args))
        );
        return stream$;
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        const stream$ = this.connection$.pipe(
            mergeMap(_ => this.connection.invoke<T>(methodName, ...args))
        );
        return stream$;
    }
    // #endregion

    // #region on/off
    private _subscriptions = new Map<string, Array<(...args: any[]) => void>>();

    private registerHandlers(): void {
        for (let methodName in this._subscriptions) {
            const methods = this._subscriptions[methodName];
            for (let i = 0; i < methods.length; ++i) {
                this.connection.on(methodName, methods[i]);
            }
        }
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        if (!methodName) {
            throw new ArgumentException(methodName);
        }
        if (!newMethod) {
            throw new ArgumentException(newMethod);
        }

        let methods = this._subscriptions[methodName];
        if (!methods) {
            methods = [];
            this._subscriptions[methodName] = methods;
        }

        if (methods.indexOf(newMethod) >= 0) {
            throw new ObjectAlreadyExistException(methodName);
        }

        methods.push(newMethod);
        this._on(methodName, newMethod);
    }

    private _on(methodName: string, newMethod: (...args: any[]) => void) {
        if (this.connection) {
            this.connection.on(methodName, newMethod);
        }
    }

    off(): void;
    off(methodName: string): void;
    off(methodName: string, method: (...args: any[]) => void): void;
    off(methodName?: any, method?: any): void {
        if (!methodName) {
            return this._offAll();
        }
        if (!method) {
            return this._offByMethodName(methodName);
        }
        return this._offByMethod(methodName, method);        
    }

    private _offAll() {
        for (let methodName in this._subscriptions) {
            if (this._subscriptions.hasOwnProperty(methodName)) {
                this._offByMethodName(methodName);
            }
        }
    }

    private _offByMethodName(methodName: string): void {
        const methods = this._subscriptions[methodName];
        if (!methods) {
            return;
        }

        for (let i = 0; i < methods.length; ++i) {
            this._off(methodName, methods[i]);
        }
        methods.splice(0, methods.length);
    }

    private _offByMethod(methodName: string, method: any) {
        const methods = this._subscriptions[methodName];
        if (!methods) {
            return;
        }

        const index = methods.indexOf(method)
        if (index === -1) {
            return;
        }

        methods.splice(index, 1);
        this._off(methodName, method);
    }

    private _off(methodName: string, method: any) {
        if (this.connection) {
            this.connection.off(methodName, method);
        }
    }
    // #endregion

    // #region common
    private _connectionHost: string;
    get connectionHost(): string {
        if (!this._connectionHost) {
            this._connectionHost = /(.+:\/\/)?([^\/]+)(\/.*)*/i.exec(this.connectionUrl)[2];
        }
        return this._connectionHost;
    }

    private trace(message?: any, ...optionalParams: any[]): void {
        if (this.enableTracing) {
            console.trace(`[REALTIME]:${this.connectionHost}: ${message}`, ...optionalParams);
        }
    }
    // #endregion
}
