exec = require('child_process').exec

class Introspection extends ChannelAgent
    constructor: ->
        @subscribe('introspect-nodes', () => @publish('introspect-nodes-resp', @get_nodes()))
    
    get_nodes: ->
        exec('../commandlets/introspection/introspect.py', [], (error, stdout, stderr) =>
            if error != null
                console.log(stdout)
                JSON.parse(stdout)

exports.Introspection = Introspection