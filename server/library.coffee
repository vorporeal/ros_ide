path = require("path")
fs = require("fs")
node = require("./node")

class Library

  constructor: (library_path) ->
    @path = library_path
    @library_file_path = path.join(@path, 'library.json')
    @load()
    
  load: ->
    json = JSON.parse(fs.readFileSync(@library_file_path))
    @nodes = ( new node.Node(n) for n in json['nodes'] )
    
  toJSON: -> { 'nodes': ( n.toJSON() for n in @nodes ) }

exports.Library = Library