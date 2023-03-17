import { RealtimeTransportType } from './realtime.transport.type';

export interface IRealTimeConnectionOptions {
    retryCount?: number;
    autoReconnect?: boolean;
    enableTracing?: boolean;
    reconnectTimeout?: number;
    transport?: RealtimeTransportType;
    /** A boolean indicating if negotiation should be skipped.
     *
     * Negotiation can only be skipped when the transport property is set to 'RealtimeTransportType.WebSockets'.
     */
    skipNegotiation?: boolean;
};
