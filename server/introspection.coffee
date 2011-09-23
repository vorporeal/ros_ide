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
        @publish('introspect-nodes-resp', {''})

exports.Introspection = Introspection
