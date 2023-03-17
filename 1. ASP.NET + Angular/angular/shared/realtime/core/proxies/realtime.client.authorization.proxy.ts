import { clearAuthCookies } from '@app/shared/common/auth/app-auth.service';
import { IRealtimeClient } from '@custom/shared/realtime';
import { NotAuthorizedException, AuthorizeTokenExpiredException } from '@custom/tst';
import { RealtimeClientBaseProxy } from '@src/custom/shared/realtime/core/proxies/realtime.client.base.proxy';
import { EMPTY, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';

export class RealtimeClientAuthorizationProxy extends RealtimeClientBaseProxy implements IRealtimeClient {
    constructor(
        realtimeClient: IRealtimeClient
    ) {
        super(realtimeClient);
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.realtimeClient.invoke<T>(methodName, ...args).pipe(
            concatMap(response => {
                if (!response) {
                    return of(response);
                }

                const exception = response['exception'];
                if (exception) {
                    const exceptionType = exception.type;
                    if (exceptionType === nameof(NotAuthorizedException) ||
                        exceptionType === nameof(AuthorizeTokenExpiredException)) {
                        clearAuthCookies();
                        location.href = '';
                        return EMPTY;
                    }
                }
                return of(response);
            })
        );
    }
}
