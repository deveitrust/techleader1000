import {
    HubConnection,
} from '@aspnet/signalR';
import {
    IRealTimeConnection,
} from '../abstract';
import { Observable, Subject, from } from 'rxjs';
import { mapTo } from 'rxjs/operators';

// GOF pattern: Adapter
export class SignalRConnectionAdapter implements IRealTimeConnection {
    constructor(
        private readonly connection: HubConnection
    ) {
        this.connection.onclose((error: Error) => {
            this.closeSubject.next(error);
        });
    }

    private closeSubject = new Subject<Error>();
    readonly close$ = this.closeSubject.asObservable();

    start(): Observable<IRealTimeConnection> {
        return from(this.connection.start()).pipe(
            mapTo(this)
        );
    }

    stop(): Observable<void> {
        return from(this.connection.stop());
    }

    send(methodName: string, ...args: any[]): Observable<void> {
        return from(this.connection.send(methodName, ...args));
    }

    invoke<T = any>(methodName: string, ...args: any[]): Observable<T> {
        return from(this.connection.invoke<T>(methodName, ...args));
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        this.connection.on(methodName, newMethod);
    }

    off(methodName: string, method: (...args: any[]) => void): void {
        this.connection.off(methodName, method);
    }
}
