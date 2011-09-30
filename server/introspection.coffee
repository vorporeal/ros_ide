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
    @layout_nodes(ps.project.nodes) for ps in @pm.project_servers when ps.project.name == 'object_seeking'
    console.log "layout complete"
    return
    exec '../commandlets/introspect/introspect.py', [], (error, stdout, stderr) =>
      if !error?
        @pm.addProject('introspect')

        project_path = path.join(@pm.workspace_path, 'introspect/project.json')
        fs.writeFileSync(project_path, stdout)
        ps.project.load() for ps in @pm.project_servers when ps.project.name == 'introspect'
        @publish('introspect-nodes-resp', {''})

  layout_nodes: (nodes) ->
    n._vel = 0 for n in nodes
    n.x = Math.random() * 100 for n in nodes
    n.y = Math.random() * 100 for n in nodes
    epsilon = 0.00001
    first = 0
    until first == 10000000 or (ke < epsilon and first != 0)
      first += 1
      console.log "i = " + first
      console.log "ke = " + ke
      ke = 0
      for this_node in nodes
        _nf = 0
        
        for other_node in nodes when other_node != this_node
          _nf += @coulomb_repulsion(this_node, other_node)
        
        for other_node in @getConnectedNodes(this_node, nodes)
          _nf += @hooke_attraction(this_node, other_node)

        this_node._vel += 10 * _nf * 0.6
        this_node.x += 10 * Math.cos(this_node._vel)
        this_node.y += 10 * Math.sin(this_node._vel)
        ke += this_node._vel * this_node._vel

  coulomb_repulsion: (n1, n2) ->
    k = 8.987551e9
    r2 = (n1.x - n2.x) * (n1.x - n2.x) + (n1.y - n2.y) * (n1.y - n2.y)
    q = 1e-19
    return (k*q*q) / r2

  hooke_attraction: (n1, n2) ->
    k = 10000
    r = Math.sqrt((n1.x - n2.x) * (n1.x - n2.x) + (n1.y - n2.y) * (n1.y - n2.y)) / 2.0
    return -k*r

  getConnectedNodes: (n, nodes) ->
    connected = []
    for o in n.outputs
      for n2 in nodes
        for i in n2.inputs
          if o.connections.indexOf(i.id) != -1 and n2 != n
            connected.push(n2)

    for i in n.inputs
      for n2 in nodes
        for o in n2.outputs
          if i.connections.indexOf(o.id) != -1 and n2 is not n
            connected.push(n2)

    return connected
exports.Introspection = Introspection
