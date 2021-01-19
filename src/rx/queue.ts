import { Subject, Subscriber, Subscription } from 'rxjs';

export class QueueingSubject<T> extends Subject<T> {
  private values: T[] = [];

  next(value: T): void {
    if (this.closed || this.observers.length) {
      super.next(value);
    } else {
      this.values.push(value);
    }
  }

  _subscribe(subscriber: Subscriber<T>): Subscription {
    // noinspection JSDeprecatedSymbols
    const subscription = super._subscribe(subscriber);

    if (this.values.length) {
      this.values.forEach((value) => super.next(value));
      this.values.splice(0);
    }

    return subscription;
  }
}
