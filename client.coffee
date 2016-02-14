Wrapper = require './wrapper'

module.exports = class MikuiaClient
	@wr = null

	constructor: (address) ->
		@wr = new Wrapper address

	_sendRequest: (method, args, callback) =>
		@wr.send
			method: method
			args: args
		, callback

	getExample: (callback) =>
		@_sendRequest 'getExample', null, callback
