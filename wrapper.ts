import * as cli from 'cli-color';
import * as zmq from 'zmq';

import {MikuiaClient} from './client';
import {Tools} from './tools';

export class Wrapper {
	private promises = {};
	private req: zmq.Socket;
	private sub: zmq.Socket;

	constructor(private address: string, private ports: number[], private client: MikuiaClient) {
		this._req();
		this._sub();
	}

	_req() {
		this.req = zmq.socket('req');

		// this.req.on('connect', () => { console.log(cli.redBright('REQ: ') + 'connect'); });
		this.req.on('connect_delay', () => { console.log(cli.redBright('REQ: ') + 'connect_delay'); });
		this.req.on('connect_retry', () => { console.log(cli.redBright('REQ: ') + 'connect_retry'); });
		this.req.on('listen', () => { console.log(cli.redBright('REQ: ') + 'listen'); });
		this.req.on('bind_error', () => { console.log(cli.redBright('REQ: ') + 'bind_error'); });
		this.req.on('accept', () => { console.log(cli.redBright('REQ: ') + 'accept'); });
		this.req.on('accept_error', () => { console.log(cli.redBright('REQ: ') + 'accept_error'); });
		this.req.on('close', () => { console.log(cli.redBright('REQ: ') + 'close'); });
		this.req.on('close_error', () => { console.log(cli.redBright('REQ: ') + 'close_error'); });
		// this.req.on('disconnect', () => { console.log(cli.redBright('REQ: ') + 'disconnect'); });

		this.req.on('connect', () => {
			console.log(cli.redBright('REQ: ') + 'connect');

			this.sub.connect(this.address + ':' + this.ports[0]);
		});

		this.req.on('disconnect', () => {
			console.log(cli.redBright('REQ: ') + 'disconnect');

			this.sub.disconnect(this.address + ':' + this.ports[0]);

			this.client.emit('disconnected');
		});

		this.req.on('message', (data) => {
			console.log(data);
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
					type: null,
					error: true,
					message: null
				}

				jsonData = Tools.extend(defaultObject, jsonData);

				console.log(jsonData);

				if(jsonData['error']) {
					this.promises[jsonData['id']].reject(jsonData['message']);
				} else {
					this.promises[jsonData['id']].resolve(jsonData['message']);
				}
			}
		});

		this.req.monitor();
	}

	_sub() {
		this.sub = zmq.socket('sub');

		// this.sub.on('connect', () => { console.log(cli.cyanBright('SUB: ') + 'connect'); });
		this.sub.on('connect_delay', () => { console.log(cli.cyanBright('SUB: ') + 'connect_delay'); });
		this.sub.on('connect_retry', () => { console.log(cli.cyanBright('SUB: ') + 'connect_retry'); });
		this.sub.on('listen', () => { console.log(cli.cyanBright('SUB: ') + 'listen'); });
		this.sub.on('bind_error', () => { console.log(cli.cyanBright('SUB: ') + 'bind_error'); });
		this.sub.on('accept', () => { console.log(cli.cyanBright('SUB: ') + 'accept'); });
		this.sub.on('accept_error', () => { console.log(cli.cyanBright('SUB: ') + 'accept_error'); });
		this.sub.on('close', () => { console.log(cli.cyanBright('SUB: ') + 'close'); });
		this.sub.on('close_error', () => { console.log(cli.cyanBright('SUB: ') + 'close_error'); });
		this.sub.on('disconnect', () => { console.log(cli.cyanBright('SUB: ') + 'disconnect'); });

		this.sub.on('connect', () => {
			this.client.emit('connected');
		});

		this.sub.on('message', (topic, message) => {
			var data = JSON.parse(message.toString());

			this.client.emit(topic.toString(), data);

			// console.log('(' + cli.greenBright(data.channel) + ') ' + cli.yellowBright(data.user['display-name']) + ': ' + data.message);

			// console.log(JSON.parse(message.toString()));
		});

		this.sub.monitor();
	}

	connect() {
		this.req.connect(this.address + ':' + this.ports[1]);
		// this.sub.connect(this.address + ':' + this.ports[0]);
	}

	disconnect() {
		this.req.disconnect(this.address + ':' + this.ports[1]);
		this.sub.disconnect(this.address + ':' + this.ports[0]);
		this.client.emit('disconnected');
	}

	reconnect(delay: number) {
		this.disconnect();
		setTimeout(() => {
			this.connect()
		}, delay);
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
		
		var promise = new Promise((resolve, reject) => {
			this.promises[amazingId] = {
				resolve: resolve,
				reject: reject
			}
		});

		// this.callbacks[amazingId];
		this.req.send(JSON.stringify(object));

		return promise;
	}

	subscribe(topic: string) {
		this.sub.subscribe(topic);
	}
}