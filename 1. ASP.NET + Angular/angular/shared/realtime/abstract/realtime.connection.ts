import { Observable } from "rxjs";

export interface IRealTimeConnection {
    start(): Observable<IRealTimeConnection>;
    stop(): Observable<void>;
    send(methodName: string, ...args: any[]): Observable<void>;
    invoke<T = any>(methodName: string, ...args: any[]): Observable<T>;
    on(methodName: string, newMethod: (...args: any[]) => void): void;
    off(methodName: string, method: (...args: any[]) => void): void;
    close$: Observable<Error>;
}
