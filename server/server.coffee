path = require('path')
pms = require './project_manager_server'
ms = require './message_server'
ispect = require('./introspection')

message_server = new ms.MessageServer()

workspace_path = path.join(process.cwd(), '../workspace')


server = new pms.ProjectManagerServer({'path': workspace_path, 'message_server': message_server})

# serve website on main thread
intro = new ispect.Introspection({'message_server': message_server, 'project_manager': server.manager})
sfs = require('./static_file_server')
static = new sfs.StaticFileServer(8000)
