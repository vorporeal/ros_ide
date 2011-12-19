path = require("path")
fs = require("fs")
node = require("./node")

class Library

  constructor: (library_path, message_server) ->
    @path = library_path
    @message_server = message_server
    @library_file_path = path.join(@path, 'library.json')
    @load()
    
  load: ->
    json = JSON.parse(fs.readFileSync(@library_file_path))
    @nodes = ( new node.Node(n, @message_server) for n in json['nodes'] )
    
  toJSON: -> { 'nodes': ( n.toJSON() for n in @nodes ) }

exports.Library = Library