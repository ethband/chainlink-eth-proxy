import {client as WebSocketClient, connection as Connection, IMessage, server as WebSocketServer} from 'websocket';
import {logger} from './logger';
import {ReplaySubject, Subject} from "rxjs";

export class WebSocketProxy {
    private server: WebSocketServer;

    constructor(server: WebSocketServer) {
        this.server = server;
    }

    pass(url: string, filter: (m: IMessage) => boolean = (_) => true): void {
        this.server.on('connect', (source: Connection) => {
            logger.debug('Connected to source');

            const message$ = new ReplaySubject<IMessage>();

            source.on('message', (message: IMessage) => {
                if (!filter(message)) {
                    return;
                }

                message$.next(message);
            });

            const wsClient = new WebSocketClient({});
            wsClient.on('connect', (target: Connection) => {
                logger.debug('Connected to target');

                message$.subscribe(message => {
                    if (!target.connected) {
                        logger.debug('Unable to redirect source message to target: connection is closed');
                        return;
                    }

                    logger.debug(`Sending message: source --> target: ${message.utf8Data}`);
                    WebSocketProxy.sendMessage(target, message);
                })

                target.on('message', (message: IMessage) => {
                    if (!source.connected) {
                        logger.debug('Unable to redirect target message to source: connection is closed');
                        return;
                    }
                    logger.debug(`Sending message: target --> source: ${message.utf8Data}`);
                    WebSocketProxy.sendMessage(source, message);
                });

                source.on('close', () => {
                    logger.debug(`Closing 'target' connection ...`);
                    if (!target.connected) {
                        logger.debug(`Unable to close 'target' connection: connection is already closed`);
                        return;
                    }
                    target.close();
                    logger.debug(`Successfully closed 'target' connection`);
                });

                target.on('close', () => {
                    logger.debug(`Closing 'source' connection ...`);
                    if (!source.connected) {
                        logger.debug(`Unable to close 'source' connection: connection is already closed`);
                        return;
                    }
                    source.close();
                    logger.debug(`Closed 'source' connection`);
                });
            });

            wsClient.on('connectFailed', (e: Error) => {
                logger.error(`target connection failed: ${e}`);
            });

            wsClient.connect(url, null);
        });
    }

    private static sendMessage(connection: Connection, message: IMessage): void {
        switch (message.type) {
            case 'utf8':
                connection.sendUTF(message.utf8Data);
                break;
            case 'binary':
                connection.sendBytes(message.binaryData);
                break;
        }
    }
}
