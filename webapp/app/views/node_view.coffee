class RIDE.NodeView extends Backbone.View
  tagName: 'div'
  className: 'node'
  
  
  initialize: (args) ->
    @template = JST.node
    @rect = null;
    @editRect = null;
    @model.view = this
    @model.bind 'change', @render
    
  render: =>
    $(@el).html JST.node(@model.toJSON())
    _.each(@model.inputs, (input, i) => input.el = @$("#node#{@model.id}-input#{i}"))
    _.each(@model.outputs, (output, i) => output.el = @$("#node#{@model.id}-output#{i}"))
    @updateRects()
    this

  updateRects: ->
    $(@el)[0].style.left = "#{@model.get('x')}px"
    $(@el)[0].style.top = "#{@model.get('y')}px"
    
    @rect = new RIDE.Rect().getFromElement(@el, true)
    
    input.rect = new RIDE.Rect().getFromElement(input.el, false) for input in @model.inputs
    output.rect = new RIDE.Rect().getFromElement(output.el, false) for output in @model.outputs
    this