class RIDE.Connection extends Backbone.Model
  
  initialize: (@parent) ->
    @name = ''
    @id = ''
    @connections = []
    
  parse: (json) ->
    @name = json.name
    @id = json.id
    @_json_ids = json.connections
    @connections = []
    this
    
  toJSON: ->
    id: @id
    name: @name
    connections: _.map(@connections, (c) -> c.id)
    
  connectTo: (other) ->
    unless other?
      console.log "Attempted to connect to undefined node"
      return
    
    @connections.push @other unless other in @connections
    other.connections.push this unless this in other.connections

  disconnectFrom: (other) ->
    @connections = _.without(@connections, other)
    other.connections = _.without(@connections, this)