import {
  client as WebSocketClient,
  connection as Connection,
  IClientConfig,
} from 'websocket';
import { Observable, Subject } from 'rxjs';
import { ReactiveConnection } from './connection';
import { Url } from 'url';
import { OutgoingHttpHeaders, RequestOptions } from 'http';

export class ReactiveWebSocketClient {
  private client: WebSocketClient;

  constructor(config?: IClientConfig) {
    this.client = new WebSocketClient(config);
  }

  connect(
    requestUrl: Url | string,
    requestedProtocols?: string | string[],
    origin?: string,
    headers?: OutgoingHttpHeaders,
    extraRequestOptions?: RequestOptions,
  ): void {
    this.client.connect(
      requestUrl,
      requestedProtocols,
      origin,
      headers,
      extraRequestOptions,
    );
  }

  connection$(): Observable<ReactiveConnection> {
    const subject = new Subject<ReactiveConnection>();
    this.client.on('connect', (connection: Connection) => {
      subject.next(new ReactiveConnection(connection));
    });
    this.client.on('connectFailed', (err: Error) => {
      subject.error(err);
    });
    return subject;
  }
}
