import { MessageService } from '@abp/message/message.service';
import { IRealtimeClient } from '@custom/shared/realtime';
import { TargetInvocationException, UserFriendlyException } from '@src/custom/shared/exceptions';
import { AppLocalizationService } from '@src/custom/shared/localization';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RealtimeClientBaseProxy } from './realtime.client.base.proxy';

export class UserFriendlyExceptionProxy extends RealtimeClientBaseProxy implements IRealtimeClient {
    constructor(
        realtimeClient: IRealtimeClient,
        private readonly _messageService: MessageService,
        private readonly _localizationService: AppLocalizationService
    ) {
        super(realtimeClient);
    }

    invoke<T>(methodName: string, ...args: any[]): Observable<T> {
        return this.realtimeClient.invoke(methodName, ...args).pipe(
            catchError(err => {
                if (err instanceof TargetInvocationException
                    && err.innerException instanceof UserFriendlyException) {
                    const { message, details } = err.innerException;
                    const localizedMessage = this._localizationService.localize(message, details);
                    this._messageService.error(localizedMessage);
                }
                throw err;
            }),
        );
    }
}
