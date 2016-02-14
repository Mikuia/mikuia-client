Wrapper = require './wrapper'

module.exports = class MikuiaClient
	constructor: (address) ->
		@wr = new Wrapper address

	_sendRequest: (method, args, callback) =>
		@wr.send {method, args}, callback

	getExample: (callback) =>
		@_sendRequest 'getExample', null, callback
