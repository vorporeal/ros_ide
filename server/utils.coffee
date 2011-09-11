Array::remove = (object) ->
  idx = this.indexOf(object)
  this.splice(idx, 1) if idx > -1
  this
  
Array::includes = (object) -> this.indexOf(object) != -1

class Map

  remove: (key) ->
    delete this[i] for i in Object.keys(this) when i == key
    this
    
  includes: (key) ->
    key in Object.keys(this)
    
  empty: ->
    Object.keys(this).length == 0
    
exports.Map = Map