class RIDE.Rect

  constructor: (@left, @top, @width, @height) ->
    @right = @left + @width
    @bottom = @top + @height
    @centerX = @left + ( @width >> 1 )
    @centerY =  @top + ( @height >> 1 )
    
  getFromElement: (element, noMargin) ->
    e = $(element)
    offset = e.offset()
    new RIDE.Rect(offset.left - noMargin * parseInt(e.css('marginLeft'), 10),
		              offset.top - noMargin * parseInt(e.css('marginTop'), 10),
		              e.innerWidth(),
		              e.innerHeight()
		              )
		              
	contains: (x, y) ->
	  x >= @left && x < @right && y >= @top && y < @bottom

  intersects: (rect) ->
    @right > rect.left && rect.right > @left && @bottom > rect.top && rect.bottom > @top