import { IMessage, server as WebSocketServer } from 'websocket';
import * as http from 'http';
import { logger } from './logger';
import { ObservableWebSocketServer } from './ws/server';
import { ObservableWebSocketClient } from './ws/client';
import { QueueingSubject } from './rx/queue';

const httpServer = http.createServer();
const wsServer = new ObservableWebSocketServer(
    new WebSocketServer({
        httpServer: httpServer,
        autoAcceptConnections: false,
        keepalive: false,
    }),
);

wsServer.request$().subscribe((request) => {
    request.accept(null, request.origin);
    logger.debug(`Accepted Connection from '${request.origin}' origin`);
});

wsServer.connection$().subscribe((sourceConnection) => {
    const client = new ObservableWebSocketClient();
    const queue$ = new QueueingSubject<IMessage>();

    sourceConnection.message$().subscribe((message) => {
        queue$.next(message);
    });

    client.connection$().subscribe((targetConnection) => {
        queue$.subscribe((message) => {
            targetConnection.send(message);
        });

        targetConnection.message$().subscribe((message) => {
            sourceConnection.send(message);
        });

        sourceConnection.close$().subscribe(() => {
            targetConnection.close();
        });

        targetConnection.close$().subscribe(() => {
            sourceConnection.close();
        });
    });

    client.connect('wss://rinkeby.infura.io/ws/v3/974313720f124f9d96cdc98391277fcb');
});

const port = 3000;
httpServer.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
});
