import { IMessage, server as WebSocketServer } from 'websocket';
import * as http from 'http';
import { logger } from './logger';
import { ReactiveWebSocketServer } from './ws/server';
import { ReactiveWebSocketClient } from './ws/client';
import { QueueingSubject } from './rx/queue';

const httpServer = http.createServer();
const wsServer = new ReactiveWebSocketServer(
  new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: false,
    keepalive: false,
  }),
);

wsServer.request$().subscribe((request) => {
  request.accept(null, request.origin);
});

wsServer.connection$().subscribe((sourceConnection) => {
  const client = new ReactiveWebSocketClient();
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

  client.connect(
    'wss://rinkeby.infura.io/ws/v3/974313720f124f9d96cdc98391277fcb',
  );
});

const port = 3000;
httpServer.listen(port, () => {
  logger.info(`Server is listening on port ${port}`);
});
