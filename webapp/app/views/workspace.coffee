class RIDE.Project extends Backbone.Model
  

class RIDE.ProjectsCollection extends Backbone.Collection
  model: RIDE.Project


class RIDE.WorkspaceView extends Backbone.View
  template: _.template($("workspace-template").html()) 
  el: $('#workspace')

  events: 
    "click .newproject": "newProject"
    "click .project-link": "openProject"
    "click .ntrospect": "introspectProject"

  initialize: ->
    RIDE.Projects = new RIDE.ProjectsCollection
    RIDE.Projects.bind 'all', @render

    channel('workspace-list-response').susbscribe (data) ->
      RIDE.Projects.reset(data.projects)

    channel('workspace-list-request').publish({})

  render: ->
    @$().html @template({
        names: p.name for p in RIDE.projects
      })

  openProject: -> window.location = "/project/#{this.innerHTML}/"

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
