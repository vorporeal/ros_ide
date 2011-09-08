path = require("path")
fs = require("fs")
node = require("./node")

class Library

  constructor: (path) ->
    @path = path
    @library_file_path = path.join(@path, 'library.json')
    @load()
    
  load: ->
    require(@library_file_path)
    @nodes = Node(options) for n in nodes
