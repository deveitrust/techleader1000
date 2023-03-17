import {
    RealtimeTransportType,
    IRealTimeConnectionOptions
} from '../abstract';

export class RealTimeConnectionOptions implements IRealTimeConnectionOptions {
    constructor(options?: Partial<IRealTimeConnectionOptions>) {
        // assign default settings for this instance, then assign passed options
        Object.assign(this, RealTimeConnectionOptions.defaults, options);
    }

    retryCount?: number;
    autoReconnect?: boolean;
    enableTracing?: boolean;
    reconnectTimeout?: number;
    transport?: RealtimeTransportType;

    public static defaults: IRealTimeConnectionOptions = {
        retryCount: Number.MAX_SAFE_INTEGER, // infinite
        autoReconnect: true,
        enableTracing: false,
        reconnectTimeout: 3000,
        transport: RealtimeTransportType.Any
    };
};
