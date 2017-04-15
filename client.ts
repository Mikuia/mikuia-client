import * as events from 'events';

import {Wrapper} from './wrapper';

export class MikuiaClient extends events.EventEmitter {
    private wr: Wrapper;

    constructor(address: string) {
        super();
        this.wr = new Wrapper(address, this);
    }

    _sendRequest(method: string, args: Object | null) {
        return this.wr.send({
            method: method,
            args: args
        });
    }

    connect() {
        this.wr.connect();
    }

    identify(name: string) {
        this._sendRequest('identify', name).then(() => {
            this.emit('identify');
        })
    }

    getExample() {
        return this._sendRequest('getExample', null);
    }
}