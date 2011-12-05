class RIDE.SelectionTool

  constructor: (@doc) ->
    @startX = 0;
    @startY = 0;
    @element = document.createElement('div')
    @element.className = 'selectionbox'
    document.body.appendChild(@element)
    
  updateElement: (endX, endY) ->
    left = Math.min(@startX, endX)
    top = Math.min(@startY, endY)
    right = Math.max(@startX, endX)
    bottom = Math.max(@startY, endY)
    @element.style.left = left + 'px'
    @element.style.top = top + 'px'
    @element.style.width = (right - left) + 'px'
    @element.style.height = (bottom - top) + 'px'
    @doc.setSelection(@doc.getNodesInRect(new RIDE.Rect(left, top, right - left, bottom - top)))
  	
  mousePressed: (@startX, @startY) ->
    @element.style.display = 'block'
    @updateElement(@startX, @startY)
    @doc.undoStack.endAllBatches()
    @doc.undoStack.beginBatch()
    true
  	
  mouseDragged: (x, y) -> @updateElement(x, y)

  mouseReleased: (x, y) ->
    @element.style.display = 'none'
    @doc.undoStack.endBatch()