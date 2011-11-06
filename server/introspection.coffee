exec = require('child_process').exec
ca = require('./channel_agent')
path = require('path')
fs = require('fs')

class Introspection extends ca.ChannelAgent
  
  constructor: (args) ->
    super args.message_server
    @pm = args.project_manager
    @subscribe 'introspect-nodes', () => @get_nodes()

  get_nodes: ->
    exec '../commandlets/introspect/introspect.py', [], (error, stdout, stderr) =>
         if !error?
            @pm.addProject('introspect')
            project_path = path.join(@pm.workspace_path, 'introspect/project.json')
            fs.writeFileSync(project_path, stdout)
            ps.project.load() for ps in @pm.project_servers when ps.project.name == 'introspect'
            @layout_nodes(ps.project.nodes) for ps in @pm.project_servers when ps.project.name == 'introspect'
            @publish('introspect-nodes-resp', {''})

  layout_nodes: (nodes) ->
    n._velx = 0 for n in nodes
    n._vely = 0 for n in nodes
    n.x = Math.random() * 300 for n in nodes
    n.y = Math.random() * 50 for n in nodes
    first = 0
    connections = []
    for n in nodes
      connections[n.id] = @getConnectedNodes(n, nodes)

    until first == 10000
      first += 1
      for this_node in nodes
        _nfx = 0
        _nfy = 0
        
        for other_node in nodes when other_node.id != this_node.id
          r2 = (this_node.x - other_node.x) * (this_node.x - other_node.x) + (this_node.y - other_node.y) * (this_node.y - other_node.y)
          _nfx += 1000 * (this_node.x - other_node.x) / r2
          _nfy += 800 * (this_node.y - other_node.y) / r2

        for other_node in connections[this_node.id].in when other_node.id != this_node.id
          _nfx += 0.06 * (other_node.x - this_node.x)
          _nfy += 0.06 * (other_node.y - this_node.y)
          if other_node.x > this_node.x
            [other_node.x, this_node.x] = [this_node.x, other_node.x + 400]

        for other_node in connections[this_node.id].out when other_node.id != this_node.id
          _nfx += 0.06 * (other_node.x - this_node.x)
          _nfy += 0.06 * (other_node.y - this_node.y)
          if other_node.x < this_node.x
            [other_node.x, this_node.x] = [this_node.x, other_node.x - 400]

        this_node._velx = (this_node._velx + _nfx) * 0.85
        this_node._vely = (this_node._vely + _nfy) * 0.85

      for n in nodes
        n.x += n._velx
        n.y += n._vely

    min_x = Infinity
    min_y = Infinity
    for n in nodes
      min_x = Math.min(min_x, n.x)
      min_y = Math.min(min_y, n.y)
    for n in nodes
      n.x -= min_x - 20
      n.y -= min_y - 20
    true

  getConnectedNodes: (n, nodes) ->
    connected = {'out': [], 'in': [] }
    for o in n.outputs
      for n2 in nodes
        for i in n2.inputs
          if o.connections.indexOf(i.id) != -1 and n2 != n
            connected.out.push(n2)

    for i in n.inputs
      for n2 in nodes
        for o in n2.outputs
          if i.connections.indexOf(o.id) != -1 and n2 != n
            connected.in.push(n2)

    return connected
exports.Introspection = Introspection
