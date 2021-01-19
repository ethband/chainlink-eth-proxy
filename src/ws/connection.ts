import { connection as Connection, IMessage } from 'websocket';
import { Observable, Subject } from 'rxjs';

export class ObservableConnection {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    send(message: IMessage): void {
        switch (message.type) {
            case 'utf8':
                this.connection.sendUTF(message.utf8Data);
                break;
            case 'binary':
                this.connection.sendBytes(message.binaryData);
                break;
        }
    }

    close(reasonCode?: number, description?: string): void {
        if (!this.connection.connected) {
            return;
        }

        this.connection.close(reasonCode, description);
    }

    message$(): Observable<IMessage> {
        const subject = new Subject<IMessage>();
        this.connection.on('message', (message: IMessage) => {
            subject.next(message);
        });
        return subject;
    }

    close$(): Observable<{ code: number; desc: string }> {
        const subject = new Subject<{ code: number; desc: string }>();
        this.connection.on('close', (code: number, desc: string) => {
            subject.next({ code, desc });
        });
        return subject;
    }
}
