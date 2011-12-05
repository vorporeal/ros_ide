class RIDE.Node extends Backbone.Model

  initialize: (attributes) ->
    @x = 0;
    @y = 0;
    @id = "";
    @name = "";
    @inputs = [];
    @outputs = [];
    @extras = null;
    
    @bind 'change', @publishChange
    
    if attributes?
      @parse(attributes)
      
    @view = new RIDE.NodeView({model: this})
    
  parse: (json) ->
    @x = json.x;
    @y = json.y;
    @id = json.id;
    @name = json.name;
    @inputs = _.map(json.inputs, (input) => new RIDE.Connection(this).parse(input) )
    @outputs = _.map(json.outputs, (output) => new RIDE.Connection(this).parse(output) )
    @extras = {};
    @extras[k] = v for k,v of json unless k of this
    this
  	
  toJSON: ->
    json =
      x: @x
      y: @y
      id: @id
      name: @name
      inputs: _.map( @inputs, (input) -> input.toJSON() )
      outputs: _.map( @outputs, (output) -> output.toJSON() )
    
    json[k] = v for k,v of @extras
    return json
   
  publishChange: => 
    # Only send the property that changed, not the whole node
  	json = { id: @id }
  	json[k] = v for k,v of @changedAttributes()
  	channel("project-#{projectName}-node-update").publish(json);