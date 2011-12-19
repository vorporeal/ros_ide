$ ->
	id = window.location.search.split('=')[1]
	channel("node-#{id}-source").subscribe (data) ->
		$("#editor").html(data.source)
		window.editor = ace.edit('editor')
		editor.setTheme('ace/theme/twilight')
		editor.renderer.setShowPrintMargin(false)
		editor.renderer.setHScrollBarAlwaysVisible(false)
		editor.setHighlightActiveLine(false)

		PythonMode = require('ace/mode/python').Mode
		editor.getSession().setMode(new PythonMode())

	channel("node-#{id}-edit").publish {}
