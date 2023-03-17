import { Injectable } from '@angular/core';
import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@aspnet/signalR';
import { IRealTimeConnection, IRealTimeConnectionBuilder, RealtimeTransportType, RealTimeConnectionBuilder, IRealTimeConnectionOptions } from '../abstract';
import { SignalRConnectionAdapter } from './signalr.connection.adapter';
import { SignalRSettings } from './signalr.settings';

@Injectable({
    providedIn: 'root'
})
export class SignalRConnectionBuilder extends RealTimeConnectionBuilder implements IRealTimeConnectionBuilder {
    private _builder: HubConnectionBuilder;

    constructor() {
        super();
        this.createHubConnectionBuilder();
    }

    private createHubConnectionBuilder(): void {
        this._builder = new HubConnectionBuilder();
    }

    build(): IRealTimeConnection {
        const connection = this._builder.build();
        connection.serverTimeoutInMilliseconds = SignalRSettings.serverTimeout;
        connection.keepAliveIntervalInMilliseconds = SignalRSettings.keepAlive;
        const realtimeConnection = new SignalRConnectionAdapter(connection);
        this.createHubConnectionBuilder();
        return realtimeConnection;
    }

    withUrl(url: string, options: IRealTimeConnectionOptions): IRealTimeConnectionBuilder {
        options = options || {};

        const transportType = options.transport || RealtimeTransportType.Any;
        const httpTransportType = this.mapToHttpTransportType(transportType);

        const logLevel = options.enableTracing ? LogLevel.Debug : LogLevel.Warning;

        this._builder.withUrl(url, {
            transport: httpTransportType,
            logger: logLevel,
            skipNegotiation: options.skipNegotiation
        });
        return this;
    }

    private mapToHttpTransportType(transportType: RealtimeTransportType): HttpTransportType {
        let httpTransportType = HttpTransportType.None;
        if ((transportType & RealtimeTransportType.LongPolling) !== 0) {
            httpTransportType |= HttpTransportType.LongPolling;
        }
        if ((transportType & RealtimeTransportType.ServerSentEvents) !== 0) {
            httpTransportType |= HttpTransportType.ServerSentEvents;
        }
        if ((transportType & RealtimeTransportType.WebSockets) !== 0) {
            httpTransportType |= HttpTransportType.WebSockets;
        }
        return httpTransportType;
    }
}
