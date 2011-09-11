class ChannelAgent

  constructor: (message_server) ->
    @_server = message_server

  subscribe: (channel, callback) ->
    @_server.subscribe(this, channel, callback)
    true

  unsubscribe: (channel) ->
    @_server.unsubscribe(this, channel)
    true

  publish: (channel, message) ->  @_server.publish(channel, data, this)
  
exports.ChannelAgent = ChannelAgent