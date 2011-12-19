ca = require './channel_agent'
util  = require('util')
exec = require('child_process').exec

class Connection

  constructor: (options) ->
    @id = options?.id ? ''
    @type = options?.type ? ''
    @name = options?.name ? ''
    @connections = options?.connections ? []

  toJSON: ->
    'id': @id
    'type': @type
    'name': @name
    'connections': @connections

class Param

  constructor: (options) ->
    @name = options?.name ? ''
    @type = options?.type ? ''
    @value = options?.value ? ''

  toJSON: ->
    'name': @name
    'type': @type
    'value': @value

class Node extends ca.ChannelAgent

  EXEC_ROSLAUNCH: 0
  EXEC_BINARY: 1

  constructor: (options, message_server) ->
    super(message_server)
    @id = options?.id ? ''
    @x = options?.x ? 0
    @y = options?.y ? 0
    @name = options?.name ? ''
    @inputs = (new Connection(input) for input in options?.inputs ? [] )
    @outputs = (new Connection(output) for output in options?.outputs ? [] )
    @params = (new Param(p) for p in options?.params ? [] )
    @exec_name = (options?.launch ? options?.exec) ? ''
    @exec_mode = if options?.launch? then @EXEC_ROSLAUNCH else if options?.exec? then @EXEC_BINARY else null
    @remap = []
    @pkg = options?.pkg ? ''
    @subscribe "node-#{@id}-edit", => @publishSource();

  update: (values) ->
    if values.x? then @x = values.x
    if values.y? then @y = values.y
    if values.name? then @name = values.name
    if values.chdir? then @chdir = values.chdir
    if values.remap? then @remap = values.remap
    if values.pkg? then @pkg = values.pkg
    this

  toJSON: ->
    d =
      'id': @id
      'x': @x
      'y': @y
      'name': @name
      'inputs': ( i.toJSON() for i in @inputs )
      'outputs': ( o.toJSON() for o in @outputs )
      'params': ( p.toJSON() for p in @params )
      'pkg': @pkg
    if @exec_mode == @EXEC_ROSLAUNCH
      d['launch'] = @exec_name
    else if @exec_mode == @EXEC_BINARY
      d['exec'] = @exec_name
    return d

  publishSource: ->
    @publish "node-#{@id}-source", {source: "def\n
      \tthis is some python
    "}
    # cat = exec "roscd #{@pkg} && cat bin/#{@exec_name}", (error, stdout, stderr) =>
    #       @publish "node-#{@id}-source", {source: stdout}

exports.Node=Node