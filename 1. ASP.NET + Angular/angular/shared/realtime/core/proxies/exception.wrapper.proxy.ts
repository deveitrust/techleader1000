import { ExceptionFactory, TargetInvocationException } from '@custom/shared/exceptions';
import { IRealtimeClient } from '@custom/shared/realtime';
import { INodeExceptionWrapper } from '@custom/tst';
import { RealtimeClientBaseProxy } from '@src/custom/shared/realtime/core/proxies/realtime.client.base.proxy';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export class ExceptionWrapperProxy extends RealtimeClientBaseProxy implements IRealtimeClient {
    constructor(
        realtimeClient: IRealtimeClient
    ) {
        super(realtimeClient);
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.realtimeClient.invoke(methodName, ...args).pipe(
            tap(response => this.throwOnNodeException(methodName, args, response))
        );
    }

    private throwOnNodeException(methodName: string, args: any[], response: INodeExceptionWrapper) {
        if (!response) {
            return;
        }

        const originalException = response.exception;
        if (originalException) {
            const exception = ExceptionFactory.create(originalException);
            throw new TargetInvocationException(methodName, args, exception);
        }
    }
}
