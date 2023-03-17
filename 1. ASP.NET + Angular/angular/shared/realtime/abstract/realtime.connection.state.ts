export enum ConnectionState {
    Starting = 1,
    Stopping = 2,
    Stopped = 3,

    Connecting = 4,
    Reconnecting = 5,
    Connected = 6,

    Error = 7,
    RetryBackoff = 8
};
