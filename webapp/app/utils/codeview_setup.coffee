$ ->
  channel("node-source").subscribe (data) ->

    $("#editor-modal-title").html(data.name)
    $("#node-source-editor").html(data.source)

    editor = ace.edit("node-source-editor")

    editor.setTheme('ace/theme/twilight')
    editor.renderer.setShowPrintMargin(false)
    editor.renderer.setHScrollBarAlwaysVisible(false)
    editor.setHighlightActiveLine(false)

    PythonMode = require('ace/mode/python').Mode
    editor.getSession().setMode(new PythonMode())

    $("#editor-modal").modal()
