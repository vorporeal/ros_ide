class RIDE.Document extends Backbone.Model
  
  defaults:
    "selection": []
    "nodes": new RIDE.NodeCollection
  
  initialize: ->
    @undoStack = new RIDE.UndoStack
    @get('nodes').bind 'all', @notify
    @get('nodes').bind 'add', @nodeAdded
    @get('nodes').bind 'remove', @nodeRemoved
    
  notify: (e) =>
    @trigger e
  
  getNodesInRect: (rect) ->
    @get('nodes').filter (node) -> if node.view? then node.view.rect.intersects(rect) else false
    
  addNode: (node) -> @undoStack.push(new RIDE.AddNodeCommand(this, node))
    
  _addNode: (node) ->
    	@get('nodes').add(node)
  
  nodeAdded: (node) =>
    channel("project-#{RIDE.projectName}-node-add").publish(node.toJSON())
    	
  nodeRemoved: (node) =>
    channel("project-#{RIDE.projectName}-node-remove").publish(node.toJSON())
  
  deleteSelection: ->
    _.each(@get('selection'), (node) => @removeNode(node))
    
  updateNode: (node, key, value) ->
    if node[key] != value
      @undoStack.push(new RIDE.UpdateNodeCommand(@doc, node, key, value))
      
  removeNode: (node) ->
    @undoStack.beginBatch()
    (@removeConnection(input, connection) for connection in input.connections) for input in node.inputs
    (@removeConnection(connection, output) for connection in output.connections) for output in node.outputs
    @undoStack.push(new RIDE.RemoveNodeCommand(this, node))
    @undoStack.endBatch()
    
  _removeNode: (node) ->
    (connection.disconnectFrom(input) for connection in input.connections) for input in node.inputs
    (connection.disconnectFrom(output) for connection in output.connections) for output in node.outputs
    @set {'selection': _.without(@get('selection'), node)}
    @get('nodes').remove(node)
    
  addConnection: (input, output) ->
    unless _.detect(input.connections, output)
        @undoStack.push(new RIDE.AddConnectionCommand(this, input, output))
        
  _addConnection: (input, output) ->
    input.connectTo(output)
    channel("project-#{projectName}-node-connect").publish({ input: input.id,	output: output.id	})
    
  removeConnection: (input, output) ->
    if _.detect(input.connections, output)
      @undoStack.push(new RIDE.RemoveConnectionCommand(this, input, output))
      
  _removeConnection: (input, output) ->
    input.disconnectFrom(output)
    channel("project-#{projectName}-node-disconnect").publish({ input: input.id,	output: output.id	})
    
  setSelection: (sel) ->
    different = false
    if sel.length isnt @get('selection').length
      different = true
    else
      sortedNew = _.sortBy(sel, (a,b) -> a.id - b.id)
      sortedCurrent = _.sortBy(@get('selection'), (a,b) -> a.id - b.id)
      for i in [0...(sortedNew.length)]
        if sortedNew[i] isnt sortedCurrent[i]
          different = true
          break
          
    if different
      @undoStack.push(new RIDE.SetSelectionCommand(this, sel))
      
  _setSelection: (sel) ->
    @get('nodes').each (node) -> node?.view?.el.className('node')
    _.each(sel, (node) -> ode?.view?.el.className('selected node'))
    @set({selection: sel})
      
  
      
  parse: (json) ->
    @get('nodes').reset(json.nodes)
    
    connections = {}
    @get('nodes').each (node) ->
      connections[input.id] = input for input in node.inputs
      connections[output.id] = output for output in node.outputs
      
      (input.connectTo(connections[id]) for id in input._json_ids) for input in node.inputs
      (output.connectTo(connections[id]) for id in output._json_ids) for output in node.outputs
      
      
  toJSON: ->
    { nodes: @get('nodes').map((node) -> node.toJSON())}
