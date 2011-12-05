class RIDE.ConnectionView extends Backbone.View
  
  tagName: "div"
  
  initialize: ->
    @template = JST.connection


  render: =>
    $(@el).html @template(@model.toJSON())
    this
  