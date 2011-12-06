class RIDE.NodeView extends Backbone.View
  tagName: 'div'
  className: 'node'
  
  
  initialize: (args) ->
    @template = JST.node
    @rect = null;
    @editRect = null;
    @model.view = this
    @model.bind 'change', @render
    @updateRects()
    
  render: =>
    @updateRects()
    console.log(@model.toJSON())
    $(@el).html JST.node(@model.toJSON())
    this
    

  updateRects: ->
    $(@el)[0].style.left = "#{@model.x}px"
    $(@el)[0].style.top = "#{@model.y}px"
    
    @rect = new RIDE.Rect().getFromElement(@el, true)
