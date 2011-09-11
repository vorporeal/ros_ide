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
    @library = new l.Library(@workspace_path)
    @projects = (n for n in fs.readdirSync(@workspace_path) when path.exists(path.join(@workspace_path, n, 'project.json')))
    console.log p for p in @projects
    @project_servers = (new ps.ProjectServer({'path': p, 'message_server': @message_server}) for p in @projects)
    this
    
    
  addProject: (name) ->
    name = name.strip()
    unless name.match(/^\w+$/)
      return false
      
    unless @projects.includes(name)
      project_path = path.join(@workspace_path, name)
      try
        fs.mkdirSync(project_path, 755)
      fd = fs.openSync(path.join(project_path, 'project.json'), 'w')
      fs.writeSync(fd, "nodes = []\n", 0)
      @projects.push name
      @project_servers.push new ProjectServer(project_path)
      true
    
    false
    
  getProjects: -> { 'projects': [{'name': name} for name in @projects] }
    
  getLibrary: -> @library
  
exports.ProjectManager = ProjectManager