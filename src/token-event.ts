import EventEmitter from 'events';

export class Emitter<T extends Record<string, any>> {
    private _emitter = new EventEmitter();

    emit<N extends keyof T & string>(eventName: N, eventArg: T[N]) {
        this._emitter.emit(eventName, eventArg);
    }

    on<N extends keyof T & string>(
        eventName: N,
        handler: (eventArg: T[N]) => void
    ) {
        this._emitter.on(eventName, handler as any);
    }

    off<N extends keyof T & string>(
        eventName: N,
        handler: (eventArg: T[N]) => void
    ) {
        this._emitter.off(eventName, handler as any);
    }
}
