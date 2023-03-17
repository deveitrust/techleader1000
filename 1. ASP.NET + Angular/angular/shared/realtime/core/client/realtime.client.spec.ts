import { fakeAsync, flush, tick } from "@angular/core/testing";
import { InvalidOperationException, TimeoutException, IOException } from "@custom/shared/exceptions";
import { run } from "@custom/shared/rxjs";
import { cleanStylesFromDOM, expectObservableError } from '@custom/shared/testing';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { of, throwError } from "rxjs";
import {
    ConnectionState, IRealtimeClient,
    IRealTimeConnectionOptions, RealTimeConnectionBuilder
} from "../../abstract";
import { RealtimeClient } from "./realtime.client";
import { FakeRealTimeConnection, FakeRealTimeConnectionBuilder } from "../../fake";

describe(nameof<IRealtimeClient>(), () => {
    let spectator: SpectatorService<RealtimeClient>;
    const createService = createServiceFactory({
        service: RealtimeClient,
        providers: [
            FakeRealTimeConnection,
            FakeRealTimeConnectionBuilder,
            {
                provide: RealTimeConnectionBuilder,
                useExisting: FakeRealTimeConnectionBuilder
            }
        ]
    });

    const connectionUrl = 'http://test.com';
    const testEventName = 'test';
    const testEventArg = { arg: 1 };
    const testEventResponse = { response: 1 };
    const testEventMethod = () => { };

    beforeEach(() => spectator = createService());
    afterAll(() => cleanStylesFromDOM());

    describe(`${nameof<IRealtimeClient>(_ => _.start)} should`, () => {

        it('success with correct url', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            // assert
            expect(connectionSpy.method.start)
                .toHaveBeenCalled();

            expect(realtimeClient.connectionState)
                .toBe(ConnectionState.Connected);
        }));

        it('throw error when try to connect without url', fakeAsync(() => {
            // arrange
            const realtimeClient = spectator.service;

            // act
            const start = () => realtimeClient.start('');

            // assert
            expect(start).toThrowError();
        }));

        it('throw error when try to connect twice', fakeAsync(() => {
            // arrange
            const realtimeClient = spectator.service;
            const start1$ = realtimeClient.start(connectionUrl);

            // act
            run(start1$);
            const start2$ = realtimeClient.start(connectionUrl);

            // assert
            expectObservableError(start2$, InvalidOperationException);
        }));

        describe(`retry, and if error happens`, () => {

            it('fail after retryCount exceeded', fakeAsync(() => {
                // arrange
                const options: IRealTimeConnectionOptions = {
                    retryCount: 2,
                    autoReconnect: true,
                    reconnectTimeout: 250,
                    enableTracing: true
                };

                const connectTryCount =
                    + 1 // initial start invocation
                    + options.retryCount;

                const waitRetryEndTimeout =
                    options.retryCount * options.reconnectTimeout;

                const connectionSpy = spectator
                    .inject(FakeRealTimeConnection)
                    .spy;

                connectionSpy.method.start
                    .andReturn(throwError('Can not start connection'));

                const realtimeClient = spectator.service;

                // act
                const start$ = realtimeClient.start(connectionUrl, options);

                // assert
                expectObservableError(start$, TimeoutException);
                tick(waitRetryEndTimeout);

                expect(connectionSpy.method.start)
                    .toHaveBeenCalledTimes(connectTryCount);

                expect(realtimeClient.connectionState)
                    .toBe(ConnectionState.Error);
            }));

            it('success before retryCount exceeded', fakeAsync(() => {
                // arrange
                const options: IRealTimeConnectionOptions = {
                    retryCount: 2,
                    autoReconnect: true,
                    reconnectTimeout: 250,
                    enableTracing: true
                };

                const connectTryCount =
                    + 1 // initial start invocation
                    + 1 // one retry; 

                const waitRetryEndTimeout = options.reconnectTimeout;

                const connection = spectator
                    .inject(FakeRealTimeConnection)

                const connectionSpy = connection.spy;

                connectionSpy.method.start
                    .andReturn(throwError('Can not start connection'));

                const realtimeClient = spectator.service;

                // act
                const start$ = realtimeClient.start(connectionUrl, options);
                run(start$);

                connectionSpy.method.start
                    .andReturn(of(connection));

                tick(waitRetryEndTimeout);

                // assert
                expect(connectionSpy.method.start)
                    .toHaveBeenCalledTimes(connectTryCount);

                expect(realtimeClient.connectionState)
                    .toBe(ConnectionState.Connected);
            }));
        });
    });

    describe('reconnect', () => {
        it('after connection closed', fakeAsync(() => {
            // arrange
            const options: IRealTimeConnectionOptions = {
                retryCount: 1,
                autoReconnect: true,
                reconnectTimeout: 250,
                enableTracing: true
            };

            const connectTryCount =
                + 1 // initial start invocation
                + 1 // one retry; 

            const waitRetryEndTimeout = options.reconnectTimeout;

            const connection = spectator
                .inject(FakeRealTimeConnection)

            const connectionSpy = connection.spy;

            connectionSpy.method.start
                .andReturn(of(connection));

            const realtimeClient = spectator.service;

            // act
            const start$ = realtimeClient.start(connectionUrl, options);
            run(start$);

            connection.close(new IOException());
            tick(waitRetryEndTimeout);

            // assert
            expect(connectionSpy.method.start)
                .toHaveBeenCalledTimes(connectTryCount);

            expect(realtimeClient.connectionState)
                .toBe(ConnectionState.Connected);
        }));
    })
    
    describe(`${nameof<IRealtimeClient>(_ => _.send)} should`, () => {

        it('success with correct arguments', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            const send$ = realtimeClient.send(testEventName, testEventArg);
            run(send$);

            // assert
            expect(connectionSpy.method.send)
                .toHaveBeenCalledWith(testEventName, testEventArg);
        }));

        it('compelete observable on success', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            const send$ = realtimeClient.send(testEventName, testEventArg);

            let isCompleted = false;
            const subscription = send$.subscribe({
                complete: () => isCompleted = true
            });

            // assert
            expect(isCompleted).toBeTruthy();
            subscription.unsubscribe();

            expect(connectionSpy.method.send)
                .toHaveBeenCalledWith(testEventName, testEventArg);
        }));
    });

    describe(`${nameof<IRealtimeClient>(_ => _.invoke)} should`, () => {

        it('get response', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            connectionSpy.method.invoke
                .andReturn(of(testEventResponse));

            const realtimeClient = spectator.service;

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            const invoke$ = realtimeClient
                .invoke(testEventName, testEventArg);

            // assert
            run(invoke$, (response) => {
                expect(response).toBe(testEventResponse);
            });
        }));
    });

    describe(`${nameof<IRealtimeClient>(_ => _.on)} should`, () => {

        it('subscribe to events', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;
            realtimeClient.on(testEventName, testEventMethod);

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            // assert
            expect(connectionSpy.method.on)
                .toHaveBeenCalledWith(testEventName, testEventMethod);
        }));

        it('subscribe to events before starting connection', fakeAsync(() => {
            // arrange
            const connectionSpy = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;
            realtimeClient.on(testEventName, testEventMethod);

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            // assert
            expect(connectionSpy.method.on)
                .toHaveBeenCalledBefore(connectionSpy.method.start);
        }));
    });

    describe(`${nameof<IRealtimeClient>(_ => _.off)} should`, () => {

        it('unsubscribe from all events', fakeAsync(() => {
            // arrange
            const realTimeConnection = spectator
                .inject(FakeRealTimeConnection)
                .spy;

            const realtimeClient = spectator.service;
            realtimeClient.on(testEventName, testEventMethod);

            // act
            const start$ = realtimeClient.start(connectionUrl);
            run(start$);
            flush();

            realtimeClient.off();

            // assert
            expect(realTimeConnection.method.off)
                .toHaveBeenCalledWith(testEventName, testEventMethod);
        }));
    });
});
