class RIDE.EditorView extends Backbone.View
  
  el: $('div#editor-view')
  
  events:
    "mousedown": "mousePressed"
    "mousemove": "mouseMoved"
    "mouseup":   "mouseReleased"

  initialize: ->
    @canvas = @$("#canvas")[0]
    @context = @canvas.getContext('2d')
    @doc = new RIDE.Document
    @doc.bind "all", @render
    @doc.bind 'add', @nodeAdded
    @doc.bind 'reset', @nodesReset
    @tools = [
      new RIDE.NodeLinkTool(@doc),
      new RIDE.DraggingTool(@doc),
      new RIDE.SelectionTool(@doc)
    ]
    $(document).bind 'selectstart', (e) -> e.preventDefault()
    
  drawLinks: ->
    nodes = @doc.get 'nodes'
    nodes.each (node) =>
      for output in node.outputs
        for input in output.connections
          ax = output.rect.centerX
          ay = output.rect.centerY
          bx = input.rect.left-8
          b_y = input.rect.centerY
          RIDE.drawLink(@context, ax, ay, bx, b_y)
      null
    this
          
  render: =>
    minSize = @getMinSize()
    @canvas.width = minSize.width;
    @canvas.height = minSize.height;
    @context.save()
    @context.clearRect(0, 0, @canvas.width, @canvas.height)
    @drawLinks();
    @context.restore()
    this
    
  nodeAdded: (node) =>
    $(@el).append(new RIDE.NodeView({model: node}).render().el)
    node.view.updateRects()
    
  nodesReset: =>
    @doc.get('nodes').each(@nodeAdded)
    
  getMinSize: ->
    minSize = { width: 0, height: 0}
    nodes = @doc.get 'nodes'
    nodes.each (node) ->
      rect = node.view.rect
      minSize.width = Math.max(minSize.width, rect.right + 50)
      minSize.height = Math.max(minSize.height, rect.bottom + 50)
    return minSize;
    
  mousePressed: (e) ->
    @tool = null
    for tool in @tools
      if tool.mousePressed(e.pageX, e.pageY)
        @tool = tool
        break
  
  mouseMoved: (e) ->
    if @tool?
      @tool.mouseDragged(e.pageX, e.pageY)
      
  mouseReleased: (e) ->
    if @tool?
      @tool.mouseReleased(e.pageX, e.pageY)
      @tool = null
  
  selectAll: -> @doc.set {selection: @doc.get('nodes')}

  undo: ->
    @doc.undoStack.undo()
    
  redo: ->
    @doc.undoStack.redo()

  deleteSelection: ->
    @doc.deleteSelection()
    
  # this is meant to be called to insert a new node from the
  # library, not an existing node from over the network
  insertNodeFromLibrary: (json) ->
    json.id = _.uniqueId()
    _.each(json.inputs, (input) -> input.id = _.uniqueId() )
    _.each(json.outputs, (output) -> output.id = _.uniqueId() )
    @doc.addNode(new RIDE.Node().parse(json))
    
  
  onAddNodeMessage: (json) ->
    if @doc.get('nodes').any((n) -> n.id == json.id)
      return
      
    @doc.addNode(new RIDE.Node().parse(json))
    
  onRemoveNodeMessage: (json) ->
    node = @doc.get('nodes').find((n) -> n.id == json.id)
    if node?
      @doc.removeNode(node)
      
  onSetNodesMessage: (json) ->
    @doc.parse(json)
    
  onAddConnectionMessage: (json) ->
    info = RIDE.findInputAndOutput(@doc.get('nodes'), json)
    if info.input && info.output
      @doc.addConnection(info.input, info.output)
    		
  onRemoveConnectionMessage: (json) ->
    info = findInputAndOutput(@doc.get('nodes'), json)
    if info.input && info.output
      @doc.removeConnection(info.input, info.output)
  		
  onUpdateNodeMessage: (json) ->
    node = @doc.get('nodes').find((n) -> n.id == json.id)
    for k of json
      # Connections (inputs and outputs) aren't updated using the update channel
      # We also don't want to change the node id!
      if name != 'id' && name != 'inputs' && name != 'outputs'
        @doc.updateNode(node, k, json[k])

  setProjectName: (@projectName) ->
    RIDE.projectName = @projectName
    
    channel("project-#{@projectName}-node-add").subscribe (json) => @onAddNodeMessage(json)
    channel("project-#{@projectName}-node-remove").subscribe (json) => @onRemoveNodeMessage(json)
    channel("project-#{@projectName}-node-connect").subscribe (json) => @onAddConnectionMessage(json)
    channel("project-#{@projectName}-node-disconnect").subscribe (json) => @onRemoveConnectionMessage(json)
    
    # subscribe to node updates
    updateChannel = channel("project-#{@projectName}-node-update")
    updateChannel.subscribe (json) =>
      updateChannel.disable()
      @onUpdateNodeMessage json
      updateChannel.enable()
        
    @gotNodes = false
    channel("project-#{@projectName}-nodes-response").subscribe (json) =>
      unless @gotNodes
        @onSetNodesMessage json
        @gotNodes = true
    @interval = setTimeout((=> channel("project-#{@projectName}-nodes-request").publish({})), 100)

RIDE.findInputAndOutput = (nodes, json) ->
	input = null
	output = null
	nodes.each (node) ->
	  input = _.find(node.inputs, (i) -> i.id == json.input)
	  output = _.find(node.outputs, (o) -> o.id == json.output)

	return { input: input, output: output	}
