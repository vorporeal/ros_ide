class Connection

  constructor: (options) ->
    @id = options?.id ? ''
    @type = options?.type ? ''
    @name = options?.name ? ''
    @connections = options?.connections ? []
  
class Param

  constructor: (options) ->
    @name = options?.name ? ''
    @type = options?.type ? ''
    @value = options?.value ? ''

class Node
  
  EXEC_ROSLAUNCH: 0
  EXEC_BINARY: 1

  constructor: (options) ->
    @id = options?.id ? ''
    @x = options?.x ? 0
    @y = options?.y ? 0
    @name = options?.name ? ''
    @inputs = new Connection(input) for input in options.inputs if options?.inputs? else [] 
    @outputs = new Connection(output) for output in options.outputs if options?.outputs? else [] 
    @params = new Param(p) for p in options.params if options?.params? else []
    @exec_name = (options?.launch ? options?.exec) ? ''
    @exec_mode = if options?.launch? then EXEC_ROSLAUNCH else if options?.exec? then EXEC_BINARY else null
    @remap = []
    
  update: (values) ->
    if values.x? then @x = values.x
    if values.y? then @y = values.y
    if values.name? then @name = values.name
    if values.chdir? then @chdir = values.chdir
    if values.remap? then @remap = values.remap
    if values.pkg? then @pkg = values.pkg
    this