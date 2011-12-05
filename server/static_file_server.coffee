http = require("http")
url = require("url")
path = require("path")
fs = require("fs")

class StaticFileServer

  constructor: (port = 8000) ->
    http.createServer((request, response) ->
      uri = url.parse(request.url).pathname
      uri = "/index.html" if uri == "/"
      uri = "/project.html" if uri.match(/^\/project/)
      console.log(uri)
      filename = path.join("#{process.cwd()}/../webapp/public", uri)
      console.log(filename)

      path.exists filename, (exists) ->
        if !exists
          response.writeHead(404, {"Content-Type": "text/plain"})
          response.write("404 Not Found\n")
          response.end()
          return
        
        if fs.statSync(filename).isDirectory()
          filename += '/index.html'

        fs.readFile filename, "binary", (err, file) ->
          if err
            response.writeHead(500, {"Content-Type": "text/plain"})
            response.write("#{err}\n")
            response.end()
            return
          
          response.writeHead(200)
          response.write(file, "binary")
          response.end()
          
    ).listen(port)

    console.log("Static file server running at\n  => http://localhost: #{port} /\nCTRL + C to shutdown")
    
exports.StaticFileServer = StaticFileServer
