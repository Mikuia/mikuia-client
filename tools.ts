export class Tools {
	static extend(defaults: Object, options: Object) {
		var extended = {};

		for(let prop in defaults) {
			if(Object.prototype.hasOwnProperty.call(defaults, prop)) {
				extended[prop] = defaults[prop];
			}
		}

		for(let prop in options) {
			if(Object.prototype.hasOwnProperty.call(options, prop)) {
				extended[prop] = options[prop];
			}
		}
		
		return extended;
	}
}