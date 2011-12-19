window.RIDE = {}

class RIDE.Project extends Backbone.Model

class RIDE.ProjectsCollection extends Backbone.Collection
  model: RIDE.Project

class RIDE.ProjectView extends Backbone.View
  template: _.template('<div class="project"><span class="project-link"><a href="/project/<%= name %>"><%= name %></a></span></div>')

  render: =>
    $(@el).html @template({'name': @model.get('name')})
    this

class RIDE.WorkspaceView extends Backbone.View

  el: $('#workspace')

  events:
    "click .newproject": "newProject"
    "click .introspect": "introspectProject"

  initialize: ->
    @template = JST.workspace
    RIDE.projects = new RIDE.ProjectsCollection
    RIDE.projects.bind 'all', @render
    RIDE.projects.bind 'add', @addOne
    RIDE.projects.bind 'reset', @addAll

    channel('workspace-list-response').subscribe (data) ->
      RIDE.projects.reset(data.projects)

    channel('workspace-list-request').publish({})

  render: =>
    @$('div#loading').remove()
    @$('div.noproject').remove()
    if RIDE.projects.length == 0
      $(@el).append('<div class="noproject">No projects yet!</div>')

  newProject: ->
    name = window.prompt('Please enter the name of your new project')
    if name?
      if /^\W+$/.test(name)
        channel('workspace-list-add').publish {'name': name}
      else
        humane.error "The name '#{name}' is invalid"

  introspectProject: ->
    channel('introspect-nodes-resp').subscribe (data) ->
      window.location = '/project/introspect'
    channel('introspect-nodes').publish()

  addOne: (project) =>
    view = new RIDE.ProjectView({model: project})
    @$('#list').append view.render().el
    true

  addAll: =>
    @$('#list').empty()
    RIDE.projects.each(@addOne)
    true
