class RIDE.DraggingTool

  constructor: (@doc) ->
    @sel = []
    @positions = []
    @startX = 0
    @startY = 0
    
  mousePressed: (x, y) ->
    @sel = @doc.get 'selection'
    
    draggingExistingSelection = false
    for selection in @sel
      if selection.rect.contain(x, y)
        draggingExistingSelection = true
        break
        
    unless draggingExistingSelection
      @sel = @doc.getNodesInRect(new RIDE.Rect(x, y, 0, 0))
      if @sel.length == 0
        # We didn't click on a node, let another tool handle this click
        return false
      else if @sel.length > 1
        # If we've clicked on more than one node, just pick one so we can drag overlapping nodes apart
        @sel = _.last(@sel)
      @doc.setSelection @sel
      
      
    @minX = Number.MAX_VALUE
    @minY = Number.MAX_VALUE
    for selection in @sel
      rect = selection.rect
      @minX = Math.min(@minX, rect.left)
      @minY = Math.min(@minY, rect.top)

    @minX = 30 + x - @minX;
    @minY = 30 + y - @minY;

    @startX = x;
    @startY = y;
    @positions = [{x: selection.x, y: selection.y} for selection in @sel]

    # We might not have gotten a mouseup, so end any previous operation now
    @doc.undoStack.endAllBatches();
    return true;
  	
  mouseDragged: (x, y) ->
    x = Math.max(x, @minX)
    y = Math.max(y, @minY)
    for i in [0...(@sel.length)]
      node = @sel[i]
      pos = @positions[i]
      node.set 'x', pos.x + x - @startX
      node.set 'y', pos.y + y - @startY
    
  mouseReleased: (x, y) ->
    x = Math.max(x, @minX)
    y = Math.max(y, @minY)
    @doc.undoStack.beginBatch();
    for i in [0...(@sel.length)]
      node = @sel[i]
      pos = @positions[i]
      node.set 'x', pos.x
      node.set 'y', pos.y
    @doc.undoStack.endBatch();