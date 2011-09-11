path = require("path")
fs = require("fs")
node = require("./node")

class Library

  constructor: (library_path) ->
    @path = library_path
    @library_file_path = path.join(@path, 'library.json')
    @load()
    
  load: ->
    require(@library_file_path)
    @nodes = [ node.Node(n) for n in nodes ]

exports.Library = Library