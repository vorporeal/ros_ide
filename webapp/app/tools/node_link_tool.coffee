class RIDE.NodeLinkTool

  constructor: (@doc) ->
    @output = null
    @element = document.createElement('canvas')
    @element.className = 'nodelink'
    @c = @element.getContext('2d')
    $("#editor-view").append(@element)
  
  updateElement: (x, y) ->
    input = @getInputFromPoint(x, y)
    startX = @output.rect.centerX
    startY = @output.rect.centerY
    endX = if input? then input.rect.left - 8 else x
    endY = if input? then input.rect.centerY else y

    padding = 30
    left = Math.min(startX, endX) - padding
    top = Math.min(startY, endY) - padding
    right = Math.max(startX, endX) + padding
    bottom = Math.max(startY, endY) + padding

    @element.style.left = left + 'px'
    @element.style.top = top + 'px'
    @element.width = right - left
    @element.height = bottom - top

    ax = startX - left
    ay = startY - top
    bx = endX - left
    b_y = endY - top
    offset = 100

    RIDE.drawLink(@c, ax, ay, bx, b_y)
  	
  getInputFromPoint: (x, y) ->
    input = null
    @doc.get('nodes').each (node) ->
      input ||= _.find(node.inputs, (input) -> input.rect.contains(x,y))
    return input

  getOutputFromPoint: (x, y) ->
    output = null
    @doc.get('nodes').each (node) ->
      output ||= _.find(node.outputs, (output) -> output.rect.contains(x,y))
    return output
        
  mousePressed: (x, y) ->
    @output = @getOutputFromPoint(x, y)
    
    unless @output?
      input = @getInputFromPoint(x, y)
      if input? && input.connections.length > 0
        @output = input.connections[0]
        @doc.removeConnection(input, @output)
        
    if @output?
      @doc.setSelection([])
      @updateElement(x, y)
      @element.style.display = 'block'
      return true
      
    false

  mouseDragged: (x, y) -> @updateElement(x, y)

  mouseReleased: (x, y) ->
    @element.style.display = 'none'
    input = @getInputFromPoint(x, y)
    if input?
      @doc.addConnection(input, @output)
