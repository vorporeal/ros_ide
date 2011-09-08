http = require("http")
url = require("url")
path = require("path")
fs = require("fs")
port = process.argv[2] || 8000

http.createServer((request, response) ->

  uri = url.parse(request.url).pathname
  uri = "/static/main/index.html" if uri == "/"
  uri = "/static/#{uri}" if uri.match(\^project\)
  filename = path.join("#{process.cwd()}../webapp/www", uri)
  
  path.exists(filename, (exists) ->
    if !exists
      response.writeHead(404, {"Content-Type": "text/plain"})
      response.write("404 Not Found\n")
      response.end()
      return
    
    if fs.statSync(filename).isDirectory()
      filename += '/index.html'

    fs.readFile(filename, "binary", (err, file)->
      if err
        response.writeHead(500, {"Content-Type": "text/plain"})
        response.write("#{err}\n")
        response.end()
        return

      response.writeHead(200)
      response.write(file, "binary")
      response.end()
).listen(parseInt(port, 10))

console.log("Static file server running at\n  => http://localhost: #{port} /\nCTRL + C to shutdown")