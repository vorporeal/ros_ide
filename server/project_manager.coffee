path = require("path")
fs = require("fs")
ps = require './project_server'
l = require './library'

class ProjectManager

  constructor: (args) ->
    @message_server = args.message_server
    @setWorkspace(args.path)
    this

  setWorkspace: (working_path) ->
    try
      fs.mkdirSync(working_path, 755)
    @workspace_path = working_path
    @library = new l.Library(@workspace_path, @message_server)
    @projects = (n for n in fs.readdirSync(@workspace_path) when n != 'introspect' and path.existsSync(path.join(@workspace_path, n, 'project.json')))
    @project_servers = (new ps.ProjectServer({'path': path.join(@workspace_path, p), 'message_server': @message_server}) for p in @projects)
    this

  addProject: (name) ->
    name = name.trim()
    unless name.match(/^\w+$/)
      return false

    unless @projects.includes(name)
      project_path = path.join(@workspace_path, name)
      try
        fs.mkdirSync(project_path, 0755)
      fs.writeFileSync(path.join(project_path, 'project.json'), '{"nodes": []}')
      @projects.push name
      @project_servers.push new ps.ProjectServer({'path': project_path, 'message_server': @message_server})
      true

    false

  getProjects: -> { 'projects': ({'name': name} for name in @projects) }

  getLibrary: -> @library.toJSON()

exports.ProjectManager = ProjectManager
