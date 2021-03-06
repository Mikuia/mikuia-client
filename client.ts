import * as events from 'events';
import {promises as fs} from 'fs';

import {Wrapper} from './wrapper';

export class MikuiaClient extends events.EventEmitter {
	public connected: boolean;

	private heartbeatTimer: NodeJS.Timer;
	private name: string;
	private token: string;
	private wr: Wrapper;

	constructor(address?: string, ports?: number[]) {
		super();
		
		if(!address) address = 'tcp://127.0.0.1';
		if(!ports) ports = [3000, 3001];

		this.connected = false;
		this.name = 'plugin_' + Math.random().toString(36).slice(-10);
		this.token = '';
		this.wr = new Wrapper(address, ports, this);

		this.on('connected', () => {
			this.heartbeatTimer = setInterval(() => {
				this.heartbeat();
			}, 10 * 1000);
		})

		this.on('disconnected', () => {
			this.connected = false;
			clearInterval(this.heartbeatTimer);
		});
	}

	_sendRequest(method: string, args: Object | null) {
		return this.wr.send({
			method: method,
			args: args,
			token: this.token
		});
	}

	connect() {
		this.wr.connect();
	}

	disconnect() {
		this.wr.disconnect();
	}

	reconnect(delay: number) {
		this.wr.reconnect(delay);
	}

	heartbeat() {
		this._sendRequest('heartbeat', null).then(() => {
			console.log('heartbeat!');
		}).catch((err) => {
			console.log('heartbeat failed.');
			this.reconnect(1000);
		});
	}

	identify(name: string) {
		// this.name = name;
		this._sendRequest('identify', { name: name }).then((token: string) => {
			console.log('identified');
			this.name = name;
			this.token = token;
			this.connected = true;

			this.emit('identified');
		}).catch((err) => {
			console.log('failed to identify');
			this.reconnect(1000);
		})
	}

	subscribe(topic: string) {
		this.wr.subscribe(topic);
	}

	registerHandler(name: string, info: object) {
		this._sendRequest('registerHandler', {
			name: name,
			info: info
		}).then(() => {
			console.log('registered handler: ' + name);
			this.subscribe('event:handler:' + name);
		}).catch((err) => {
			console.log('failed to register handler: ' + name);
		});
	}

	async registerLocales() {
		var languages = await fs.readdir('locales');
		for(var lang of languages) {
			var files = await fs.readdir(`locales/${lang}`);
			for(var file of files) {
				var data = JSON.parse(await fs.readFile(`locales/${lang}/${file}`, { encoding: 'utf8' }));

				await this._sendRequest('registerLocale', {
					language: lang,
					type: file.replace('.json', ''),
					data: data
				});
			}
		}
	}

	respond(event: object, data: object) {
		this._sendRequest('respond', {
			event: event,
			data: data
		}).then(() => {
			console.log('successful thing something omg');
		}).catch((err) => {
			console.log('you fucked up');
		})
	}

	getExample() {
		return this._sendRequest('getExample', null);
	}
}