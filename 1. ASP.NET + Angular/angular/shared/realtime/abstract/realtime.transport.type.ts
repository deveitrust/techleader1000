export enum RealtimeTransportType {
    /** Specifies no transport preference. */
    None = 0,
    /** Specifies the WebSockets transport. */
    WebSockets = 1,
    /** Specifies the Server-Sent Events transport. */
    ServerSentEvents = 2,
    /** Specifies the Long Polling transport. */
    LongPolling = 4,
    /** Specifies to use any of available transport. */
    Any = WebSockets | ServerSentEvents | LongPolling
}
