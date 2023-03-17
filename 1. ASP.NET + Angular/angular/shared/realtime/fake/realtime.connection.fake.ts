import { Injectable } from "@angular/core";
import { SpyObjectProxy } from "@custom/shared/testing";
import { Observable, of, Subject } from "rxjs";
import { IRealTimeConnection } from "../abstract";
import { ArgumentNullException } from "@custom/shared/exceptions";

@Injectable()
export class FakeRealTimeConnection implements IRealTimeConnection {
    spy: SpyObjectProxy<FakeRealTimeConnection>;

    constructor() {
        this.spy = new SpyObjectProxy(FakeRealTimeConnection);
    }

    start(): Observable<IRealTimeConnection> {
        return this.spy.object.start() || of(this);
    }

    stop(): Observable<void> {
        return this.spy.object.stop() || of(void 0);
    }

    send(methodName: string, ...args: any[]): Observable<void> {
        return this.spy.object.send(methodName, ...args) || of();
    }

    invoke<T = any>(methodName: string, ...args: any[]): Observable<T> {
        return this.spy.object.invoke(methodName, ...args) || of();
    }

    on(methodName: string, newMethod: (...args: any[]) => void): void {
        this.spy.object.on(methodName, newMethod);
    }

    off(methodName: string, method: (...args: any[]) => void): void {
        this.spy.object.off(methodName, method);
    }

    private readonly closeSubject = new Subject<Error>();
    readonly close$ = this.closeSubject.asObservable();

    close(error: Error): void {
        if (!error) {
            throw new ArgumentNullException(nameof(error));
        }
        this.closeSubject.next(error);
    }
}
