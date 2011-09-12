dt = require './deploy_thread'
project = require './project'
ca = require './channel_agent'

class ProjectServer extends ca.ChannelAgent

  constructor: (args) ->
    super(args.message_server)
    @project = new project.Project(args.path)
    @subscribe "project-#{@project.name}-nodes-request", => 
      @publish("project-#{@project.name}-nodes-response", @project.toJSON())
    @subscribe "project-#{@project.name}-node-update", (message) => 
      @project.updateNode(message)
      @publish "project-#{@project.name}-node-update", message
    @subscribe "project-#{@project.name}-node-add", (message) => @project.addNode(message)
    @subscribe "project-#{@project.name}-node-remove", (message) => @project.removeNode(message)
    @subscribe "project-#{@project.name}-node-connect", (message) => @project.addConnection(message)
    @subscribe "project-#{@project.name}-node-disconnect", (message) => @project.removeConnection(message)
    @subscribe "project-#{@project.name}-deploy-run", @run
    @subscribe "project-#{@project.name}-deploy-stop", @stop
    
    
  run: (json) ->
    @stop()
    @deploy_thread = new dt.DeployThread(json['ip'], json['user'], json['pass'], @project)
    @deploy_thread.start()
  
  stop: ->
    @deploy_thread?.kill()
    delete @deploy_thread
    
exports.ProjectServer = ProjectServer