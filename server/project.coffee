path = require 'path'
fs = require "fs"
node = require './node'
ca = require './channel_agent'
require './utils'

class Project extends ca.ChannelAgent

  constructor: (_path, message_server) ->
    super(message_server)
    @message_server = message_server
    @name = path.basename(_path)
    @nodes = []
    @setPath(_path)
    @load()

  setPath: (p) ->
    @path = p
    @project_file_path = path.join(@path, 'project.json')
    for node in @nodes
      node.setPath(@path)

  addNode: (new_node) ->
    new_node = new node.Node(new_node, @message_server) unless new_node.constructor.toString().match('Node')
    for n in @nodes
      if n.id == new_node.id
        return
    new_node.setPath(@path)
    @nodes.push(new_node)
    @save()

  updateNode: (json) ->
    for n in @nodes
      if n.id == json['id']
        n.update(json)
        break
    @save()

  removeNode: (json) ->
    @nodes = (n for n in @nodes when n.id != json['id'])
    @removeInvalidConnections()
    @save()

  addConnection: (json) ->
    [input_id, output_id] = [json['input'], json['output']]
    for n in @nodes
      for i in n.inputs
        if i.id == input_id and output_id not in i.connections
          i.connections.push(output_id)
      for o in n.outputs
        if o.id == output_id and input_id not in o.connections
          o.connections.push(input_id)
    @removeInvalidConnections()
    @save()

  removeConnection: (json) ->
    [input_id, output_id] = [json['input'], json['output']]
    for n in @nodes
      for i in n.inputs
        if i.id == input_id and output_id in i.connections
          i.connections.remove(output_id)
      for o in n.outputs
        if o.id == output_id and input_id in o.connections
          o.connections.remove(input_id)
    @removeInvalidConnections()
    @save()

  save: ->
    fs.writeFile(@project_file_path, JSON.stringify(this.toJSON(), null, 4), (err) -> console.log("could not save project") if err )

  load: ->
    json = JSON.parse(fs.readFileSync(@project_file_path))
    for node in json['nodes']
      @addNode(node)
    @removeInvalidConnections()
    @save()

  removeInvalidConnections: ->
    # TODO: REMOVE Invalid Connections
    false

  toJSON: -> { 'nodes': ( n.toJSON() for n in @nodes ) }

exports.Project = Project
