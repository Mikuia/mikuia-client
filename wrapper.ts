import * as zmq from 'zmq';

import {MikuiaClient} from './client';
import {Tools} from './tools';

export class Wrapper {
    private promises = {};
    private req: zmq.Socket;

    constructor(private address: string, private client: MikuiaClient) {}

    connect() {
        this.req = zmq.socket('req');
        this.req.monitor(500);
        this.req.connect(this.address);

        this.req.on('connect', () => {
            console.log('connected');
            this.client.emit('connect');
        })

        this.req.on('message', (data) => {
            var jsonData: Object | null = null;

            try {
                jsonData = JSON.parse(data.toString());
            } catch(e) {
                console.log('Error.');
                console.log(e);
                return;
            }

            if(jsonData != null && jsonData['id'] != null) {
                var defaultObject = {
                    type: 'error',
                    error: true,
                    message: null
                }

                jsonData = Tools.extend(defaultObject, jsonData);
                this.promises[jsonData['id']](this, [jsonData['error'], jsonData['message']]);
            }

        })
    }

    send(message: Object | string) {
        var object = message;
        if(typeof object == 'string') {
            object = {
                message: object
            }
        }

        var amazingId = Math.random().toString(36).slice(-10);
        object['id'] = amazingId;
        
        var promise = new Promise((resolve) => {
            this.promises[amazingId] = resolve;
        })

        // this.callbacks[amazingId];
        this.req.send(JSON.stringify(object));

        return promise;
    }
}