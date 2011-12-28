$ ->
  window.editor = ace.edit("node-source-editor")

  editor.setTheme('ace/theme/clouds')
  editor.renderer.setShowPrintMargin(false)
  editor.renderer.setHScrollBarAlwaysVisible(false)
  editor.setHighlightActiveLine(true)
  editor.setReadOnly(false)

  PythonMode = require('ace/mode/python').Mode
  editor.getSession().setMode(new PythonMode())

  channel("node-source").subscribe (data) ->

    $("#editor-modal-title").html(data.name)
    window.editor.getSession().setValue(data.source)

    $("#editor-save-btn").click ->
      channel("node-#{data.id}-save-source").publish(window.editor.getSession().getValue())
      $("#editor-modal").modal('hide')

    $("#editor-modal").modal('show')
