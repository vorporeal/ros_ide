class RIDE.BatchCommand

  constructor: ->
    @commands = []
  
  undo: -> 
    command.undo() for command in @commands
    true
  
  redo: ->
    command.redo() for command in @commands
    true

class RIDE.UndoStack

  constructor: (args) ->
    @batches = []
    @commands = []
    @currentIndex = 0
    @cleanIndex = 0
  
  push: (command) ->
    @_push(command)
    command.redo()
    
  _push: (command) ->
    if command instanceof RIDE.BatchCommand && command.commands.length == 0
      return
      
    if @batches.length == 0
      @commands = @commands.slice(0, @currentIndex)
      if @cleanIndex > @currentIndex
        @cleanIndex = -1;
      @commands.push command
      @currentIndex++;
    else
      commands = _.last(@batches).commands
      if commands.length > 0 && _.last(@commands).mergeWith(command)
        return
      commands.push(command)
      
  canUndo: -> @batches.length == 0 && @currentIndex > 0
  canRedo: -> @batches.length == 0 && @currentIndex < @commands.length

  beginBatch: -> @batches.push(new RIDE.BatchCommand())
  endBatch: -> if @batches.length > 0 then @._push(@batches.pop())
  endAllBatches: -> 
    while @batches.length > 0
      @endBatch()
      
  undo: -> if @canUndo() then @commands[--@currentIndex].undo()
  redo: -> if @canRedo() then @commands[@currentIndex++].redo()
  
  getCurrentIndex: -> @currentIndex
  setCleanIndex: (index) -> @cleanIndex = index
  clear: ->
    @batches = []
    @commands = []
    @currentIndex = @cleanIndex = 0