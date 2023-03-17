import { OnDestroy } from '@angular/core';
import { Observable, of, Subscription, throwError } from 'rxjs';
import { catchError, concatMap, switchMap, tap } from 'rxjs/operators';
import { ArgumentException } from '../../exceptions';
import {
    IRealtimeClient,
    IRealTimeConnectionOptions,
    RealtimeTransportType
} from '../abstract';
import { RealtimeClientFactory } from '../core/realtime.client.factory';

export class RealtimeLogTracer implements OnDestroy {
    private _subscription: Subscription;
    private readonly realtimeClient: IRealtimeClient;

    constructor(
        private readonly name: string,
        realtimeClientFactory: RealtimeClientFactory,
    ) {
        this.realtimeClient = realtimeClientFactory.create();
        this.subscribe();
    }

    ngOnDestroy(): void {
        this.unsubscribe();
    }

    stop(): Observable<void> {
        return this.realtimeClient.stop();
    }

    start(connectionBaseUrl: string): Observable<void> {
        const connectionUrl = this.getConnectionUrl(
            connectionBaseUrl
        );

        const options = {
            transport: RealtimeTransportType.WebSockets,
            // https://www.gresearch.co.uk/article/signalr-on-kubernetes/
            skipNegotiation: true,
        };

        return of(connectionUrl).pipe(
            switchMap(_ => this.startConnection(connectionUrl, options)),
            switchMap(_ => of(void 0))
        );
    }

    protected startConnection(
        connectionUrl: string,
        options?: Partial<IRealTimeConnectionOptions>
    ): Observable<IRealtimeClient> {
        return this.realtimeClient.start(connectionUrl, options);
    }

    private getConnectionUrl(connectionBaseUrl: string): string {
        connectionBaseUrl = this.getBaseUrl(connectionBaseUrl);
        const connectionUrl = this.getBaseUrl(connectionBaseUrl) + `/signalr-log`;
        return connectionUrl;
    }

    private getBaseUrl(connectionBaseUrl: string): string {
        let index = connectionBaseUrl.indexOf('://')
        if (index === -1) {
            throw new ArgumentException(nameof(connectionBaseUrl));
        }
        index = connectionBaseUrl.indexOf('/', index + 3);
        if (index > 0) {
            connectionBaseUrl = connectionBaseUrl.substring(0, index);
        }
        return connectionBaseUrl;
    }

    private subscribe() {
        this.registerEventListeners();

        this._subscription = this.realtimeClient.connected$.pipe(
            tap(_ => this.logInfo(this.formatMessage('realtime log connected'))),
            concatMap(_ => this.startLogging()),
            tap(_ => this.logInfo(this.formatMessage('realtime log started'))),
            catchError((error) => {
                this.logError(this.formatMessage('realtime log start failed: ' + error));
                return throwError(error);
            })
        ).subscribe();
    }

    private unsubscribe() {
        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = null;
        }
        this.realtimeClient.off();
    }

    private registerEventListeners() {
        this.realtimeClient.on('OnEvent', (logEntry) => {
            this.onLoggedEvent(logEntry);
        });

        this.realtimeClient.on('OnOfflineEvents', (logEntries) => {
            this.onLoggedEvents(logEntries);
        });
    }

    private startLogging(): Observable<void> {
        const request = {
            groupName: 'DefaultGroup',
            offlineLogLevel: 'Warn',
            lastReceivedEntryTimestamp: this.getLastReceivedLogEntryTimestamp()
        };

        return this.realtimeClient.send('SubscribeToGroupWithMessageOffset', request).pipe(
            catchError((error) => {
                this.logError('SubscribeToDefaultGroup: ' + error);
                return throwError(error);
            })
        );
    }

    private onLoggedEvents(logEntries: any[]): void {
        for (let i = 0; i < logEntries.length; ++i) {
            const logEntry = logEntries[i];
            const loggedEvent = logEntry.loggingEvent;
            const level = loggedEvent.level;
            level.type = `OFFLINE ${level.name}`;
            this.onLoggedEvent(logEntry);
        }
    }

    private onLoggedEvent(logEntry: any): void {
        if (!this.trySetLastReceivedLogEntry(logEntry)) {
            return;
        }

        let formattedEvent = logEntry.formattedEvent;
        const loggedEvent = logEntry.loggingEvent;

        const level = loggedEvent.level;
        const levelName = level.name;
        const messagePrefix = level.type || levelName;

        formattedEvent = this.formatMessage(`${messagePrefix}: ${formattedEvent}`);
        if (levelName === 'ERROR' || levelName === 'FATAL') {
            this.onLoggedError(formattedEvent);
        } else if (levelName === 'WARN') {
            this.onLoggedWarn(formattedEvent);
        } else if (levelName === 'INFO') {
            this.onLoggedInfo(formattedEvent);
        } else {
            this.onLoggedDebug(formattedEvent);
        }
    }

    private readonly _lastReceivedLogEntryKey = `${this.name.replace(' ', '_')}_lastReceivedLogEntryTimestamp`;
    private getLastReceivedLogEntryTimestamp(): Date | undefined {
        const value = localStorage.getItem(this._lastReceivedLogEntryKey);
        if (!value) return undefined;
        return new Date(value);
    }

    private trySetLastReceivedLogEntry(logEntry: any): boolean {
        const loggedEvent = logEntry.loggingEvent;

        const timestampString = loggedEvent.timeStamp;
        const timestamp = new Date(timestampString);

        const currentTimestamp = this.getLastReceivedLogEntryTimestamp();
        if (currentTimestamp?.getTime() >= timestamp.getTime()) {
            return false;
        }

        localStorage.setItem(
            this._lastReceivedLogEntryKey,
            timestampString
        );
        return true;
    }

    protected logInfo(formattedEvent: string): void {
        console.info(formattedEvent);
    }

    protected logError(formattedEvent: string): void {
        console.error(formattedEvent);
    }

    protected onLoggedError(formattedEvent: string): void {
        console.error(formattedEvent);
    }

    protected onLoggedWarn(formattedEvent: string): void {
        console.warn(formattedEvent);
    }

    protected onLoggedInfo(formattedEvent: string): void {
        console.info(formattedEvent);
    }

    protected onLoggedDebug(formattedEvent: string): void {
        console.debug(formattedEvent);
    }

    private formatMessage(message: string): string {
        return `[${this.name}]: ${message}`;
    }
}
