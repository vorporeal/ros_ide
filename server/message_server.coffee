require './utils'

class MessageServer

  constructor: (args) ->
    io = require('socket.io').listen(args?.port ? 8080)
    io.sockets.on('message', (message) => @onMessage(message) )
    @map = {}
    
  subscribe: (agent, channel, callback) ->
    @map[channel] = {} unless @map.includes(channel)
    @map[channel][agent] = callback
    this
    
  unsubscribe: (agent, channel) ->
    @map[channel]?.remove(agent)
    @map.remove(channel) if @map[channel]?.empty()
    this
    
  onMessage: (message) ->
    @map[message.channel][agent](message.data) for agent in Object.keys(@map[message.channel])
    this
    
  publish: (channel, data, publishing_agent) ->
    if @map.includes channel
      @map[channel][agent](message.data) for agent in Object.keys(@map[message.channel]) when agent != publishing_agent
    
    @_send {'channel': channel, 'data': data}
    this
    
  _send: (data) -> io.broadcast.send(data)
  
exports.MessageServer = MessageServer