import { MessageService } from '@abp/message/message.service';
import { Injectable } from '@angular/core';
import { AppLocalizationService } from '@src/custom/shared/localization';
import {
    ExceptionWrapperProxy,
    RealtimeClientAuthorizationProxy,
    RealtimeClientLoggingProxy,
    UserFriendlyExceptionProxy
} from '@src/custom/shared/realtime/core/proxies';
import { IRealtimeClient, RealTimeConnectionBuilder } from '../abstract';
import { RealtimeClient } from './client';

@Injectable({
    providedIn: 'root',
})
export class RealtimeClientFactory {
    constructor(
        private readonly _messageService: MessageService,
        private readonly _localizationService: AppLocalizationService,
        private readonly realTimeConnectionBuilder: RealTimeConnectionBuilder
    ) {
    }

    create(): IRealtimeClient {
        const baseClient = new RealtimeClient(this.realTimeConnectionBuilder);
        const logging = new RealtimeClientLoggingProxy(baseClient);
        const authorizationProxy = new RealtimeClientAuthorizationProxy(logging);
        const exceptionProxy = new ExceptionWrapperProxy(authorizationProxy);
        const userFirendlyExceptionProxy = new UserFriendlyExceptionProxy(exceptionProxy,
            this._messageService, this._localizationService);

        // add other proxies here

        return userFirendlyExceptionProxy;
    }
}
