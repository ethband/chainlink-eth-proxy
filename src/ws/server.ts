import {
  connection as Connection,
  request as Request,
  server as WebSocketServer,
} from 'websocket';
import { Observable, Subject } from 'rxjs';
import { ReactiveConnection } from './connection';

export class ReactiveWebSocketServer {
  private server: WebSocketServer;

  constructor(server: WebSocketServer) {
    this.server = server;
  }

  request$(): Observable<Request> {
    const subject = new Subject<Request>();
    this.server.on('request', (request: Request) => {
      subject.next(request);
    });
    return subject;
  }

  connection$(): Observable<ReactiveConnection> {
    const subject = new Subject<ReactiveConnection>();
    this.server.on('connect', (connection: Connection) => {
      subject.next(new ReactiveConnection(connection));
    });
    return subject;
  }

  close$(): Observable<{
    connection: Connection;
    reason: number;
    desc: string;
  }> {
    const subject = new Subject<{
      connection: Connection;
      reason: number;
      desc: string;
    }>();
    this.server.on(
      'close',
      (connection: Connection, reason: number, desc: string) => {
        subject.next({ connection, reason, desc });
      },
    );
    return subject;
  }
}
