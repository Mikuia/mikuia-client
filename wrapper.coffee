zmq = require 'zmq'
_ = require 'underscore'

module.exports = class Wrapper
	constructor: (address) ->
		@callbacks = {}
		
		@req = zmq.socket 'req'
		@req.connect address
		@req.on 'message', (data) =>
			jsonData = null
			try
				jsonData = JSON.parse data
			catch e
				console.log 'Error: ' + e
				return

			if jsonData.id? and callbacks[jsonData.id]
				defaultObject =
					type: 'error'
					error: true
					message: null

				jsonData = _.extend defaultObject, jsonData
				callbacks[jsonData.id].apply this, [jsonData.error, jsonData.message]

	send: (message, callback) =>
		object = message
		if typeof object == 'string'
			object =
				message: object

		if !callback?
			callback = => true

		amazingId = Math.floor(Math.random() * 1000000)
		object.id = amazingId

		callbacks[amazingId] = callback

		@req.send JSON.stringify object
