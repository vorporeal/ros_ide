ca = require './channel_agent'
pm = require './project_manager'

class ProjectManagerServer extends ca.ChannelAgent
    constructor: (args) ->
      super(args.message_server)
      @manager = new pm.ProjectManager(args)
      
      @subscribe 'workspace-list-add', (message) => @manager.addProject(message.name)
      @subscribe 'workspace-list-request', => @publish('workspace-list-response', @manager.getProjects())
      @subscribe 'workspace-library-request', => @publish('workspace-library-response', @manager.getLibrary())
      
exports.ProjectManagerServer = ProjectManagerServer