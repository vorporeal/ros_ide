util = require './utils'

class MessageServer

  constructor: (args) ->
    @_sockets = []
    @io = require('socket.io').listen(args?.port ? 8080)
    @io.sockets.on('connection', (socket) => 
      @_sockets.push socket
      socket.on 'message', (message) =>
        @onMessage(JSON.parse(message))
    )
    @map = new util.Map()
    
  subscribe: (agent, channel, callback) ->
    @map[channel] = new util.Map() unless @map.includes(channel)
    @map[channel][agent] = callback
    this
    
  unsubscribe: (agent, channel) ->
    @map[channel]?.remove(agent)
    @map.remove(channel) if @map[channel]?.empty()
    this
    
  onMessage: (message) ->
    console.log "channel = " + message.channel
    @map[message.channel][agent](message.data) for agent of @map[message.channel]
    this
    
  publish: (channel, data, publishing_agent) ->
    if @map.includes channel
      @map[channel][agent](message.data) for agent in Object.keys(@map[message.channel]) when agent != publishing_agent
    
    @_send JSON.stringify({'channel': channel, 'data': data})
    this
    
  _send: (data) -> 
    socket.send data for socket in @_sockets
    true
  
exports.MessageServer = MessageServer