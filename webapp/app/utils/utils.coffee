RIDE.drawLink = (c, ax, ay, bx, b_y) ->
	c.strokeStyle = 'yellow'
	c.fillStyle = 'yellow'
	c.lineWidth = 2
	c.shadowBlur = 3
	c.shadowColor = 'black'
	c.shadowOffsetY = 1

	c.beginPath()
	c.moveTo(ax, ay)
	c.bezierCurveTo(ax + 100, ay, bx - 90, b_y, bx, b_y)
	c.stroke()

	# Draw arrow head
	t = 0.95
	invT = 1 - t
	t0 = invT * invT * invT
	t1 = invT * invT * t * 3
	t2 = invT * t * t * 3
	t3 = t * t * t
	x = t0 * ax + t1 * (ax + 100) + t2 * (bx - 100) + t3 * bx
	y = t0 * ay + t1 * ay + t2 * b_y + t3 * b_y
	angle = Math.atan2(b_y - y, bx - x)
	sin = Math.sin(angle)
	cos = Math.cos(angle)
	c.beginPath()
	c.moveTo(bx, b_y)
	c.lineTo(bx - 10 * cos - 5 * sin, b_y - 10 * sin + 5 * cos)
	c.lineTo(bx - 10 * cos + 5 * sin, b_y - 10 * sin - 5 * cos)
	c.fill()
	
	
class RIDE.AddNodeCommand

  constructor: (@doc, @node) ->
    # body...
  
  undo: -> @doc._removeNode(@node)
  redo: -> @doc._addNode(@node)
  mergeWith: (command) -> false

class RIDE.RemoveNodeCommand

  constructor: (@doc, @node) ->
    # body...
  
  undo: -> @doc._addNode(@node)
  redo: -> @doc._removeNode(@nod)
  mergeWith: (command) -> false
  
class RIDE.UpdateNodeCommand

  constructor: (@doc, @node, @key, @value) ->
    @oldValue = @node.get @key
    @newValue = @value
    
  undo: -> 
    json = {}
    json[@key] = @oldValue
    @node.set json
  redo: ->
    json = {}
    json[@key] = @value
    @node.set json
    
  mergeWith: (command) ->
    if command instanceof RIDE.UpdateNodeCommand && @key == command.key && @newValue == command.oldValue
      @newValue = command.newValue
      return true
    return false
 
class RIDE.SetSelectionCommand

  constructor: (@doc, @newSel) ->
    @oldSel = @doc.get('selection')

  undo: -> @doc._setSelection(@oldSel)
  redo: -> @doc._setSelection(@newSel)
  mergeWith: (command) ->
    if command instanceof RIDE.SetSelectionCommand
      @newSel = command.newSel
      true
    else
    false

class RIDE.AddConnectionCommand

  constructor: (@doc, @input, @output) ->

  undo: -> @doc._removeConnection(@input, @output)
  redo: -> @doc._addConnection(@input, @output)
  mergeWith: (command) -> false
  
class RIDE.RemoveConnectionCommand

  constructor: (@doc, @input, @output) ->

  undo: -> @doc._addConnection(@input, @output)
  redo: -> @doc._removeConnection(@input, @output)
  mergeWith: (command) -> false
