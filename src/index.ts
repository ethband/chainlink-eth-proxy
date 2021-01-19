import { request as Request, server as WebSocketServer } from 'websocket';
import * as http from 'http';
import { logger } from './logger';
import { WebSocketProxy } from './proxy';

const httpServer = http.createServer();

const wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: false,
    keepalive: false,
});

wsServer.on('request', (request: Request) => {
    request.accept(null, request.origin);
    logger.debug(`Accepted Connection from '${request.origin}' origin`);
});

const wsProxy = new WebSocketProxy(wsServer);
wsProxy.pass('wss://rinkeby.infura.io/ws/v3/974313720f124f9d96cdc98391277fcb', (m) => {
    const data = JSON.parse(m.utf8Data);
    const method = data['method'];
    return true;
});

const port = 3000;
httpServer.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
});
