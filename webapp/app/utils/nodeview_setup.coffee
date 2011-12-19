$ ->
  RIDE.editor = new RIDE.EditorView(new RIDE.Document())

  focusCount = 0
  $('input').live('focus', ->  focusCount++ );
  $('input').live('blur', -> focusCount-- );

  $(document).keydown (e) ->
    #disable keyboard shortcuts inside input elements
    if focusCount > 0
      return

    if (e.ctrlKey || e.metaKey) && e.which == 'Z'.charCodeAt(0)
      if (e.shiftKey)
        RIDE.editor.redo()
      else
        RIDE.editor.undo()
      e.preventDefault()
    else if (e.ctrlKey || e.metaKey) && e.which == 'A'.charCodeAt(0)
      RIDE.editor.selectAll();
      e.preventDefault();
    else if e.which == '\b'.charCodeAt(0)
      RIDE.editor.deleteSelection();
      e.preventDefault();

  $(window).resize( ->	RIDE.editor.render())

  parent.iframeLoaded();