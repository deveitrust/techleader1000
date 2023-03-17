export class SignalRSettings {
    // NOTE: keepAlive and clientTimeout values should match server settings!

    // TODO: only for debug
    //static readonly keepAlive = 10 * 1000;
    //private static readonly stabilityThreshold = 1000;

    // if client_timeout is exactly equal to 2*keep_alive
    // then it's possible that the next keep alive ping will be called
    // when server is considering that the client has disconnected.
    // Add little stability threshold so that the keep alive will get there to server a bit early
    public static readonly keepAlive = 5 * 60 * 1000; // 5 minutes
    private static readonly stabilityThreshold = 5000; // ms

    /**
     * Documentation states that the value must be greater then the double of keep_alive value.
     * Using addition (keep_alive + keep_alive) instead of multiplication (2 * keep_alive) to avoid javascript precision issues
    **/
    public static readonly serverTimeout =
        SignalRSettings.keepAlive
        + SignalRSettings.keepAlive
        + SignalRSettings.stabilityThreshold;
}
