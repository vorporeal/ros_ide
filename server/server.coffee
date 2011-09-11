path = require('path')
pms = require './project_manager_server'
ms = require './message_server'

message_server = new ms.MessageServer()

workspace_path = path.join(process.cwd(), '../workspace')


server = new pms.ProjectManagerServer({'path': workspace_path, 'message_server': message_server})

# serve website on main thread
sfs = require('./static_file_server')
static = new sfs.StaticFileServer(8000)
