
var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

RIDE.Project = (function() {

    __extends(Project, Backbone.Model);

    function Project() {
    Project.__super__.constructor.apply(this, arguments);
    }

    return Project;

    })();

RIDE.ProjectsCollection = (function() {

    __extends(ProjectsCollection, Backbone.Collection);

    function ProjectsCollection() {
    ProjectsCollection.__super__.constructor.apply(this, arguments);
    }

    ProjectsCollection.prototype.model = RIDE.Project;

    return ProjectsCollection;

    })();

RIDE.WorkspaceView = (function() {

    __extends(WorkspaceView, Backbone.View);

    function WorkspaceView() {
    WorkspaceView.__super__.constructor.apply(this, arguments);
    }

    WorkspaceView.prototype.template = _.template($("workspace-template").html());

    WorkspaceView.prototype.el = $('#workspace');

    WorkspaceView.prototype.events = {
    "click .newproject": "newProject",
    "click .project-link": "openProject",
    "click .ntrospect": "introspectProject"
    };

    WorkspaceView.prototype.initialize = function() {
    RIDE.Projects = new RIDE.ProjectsCollection;
    RIDE.Projects.bind('all', this.render);
    channel('workspace-list-response').susbscribe(function(data) {
        return RIDE.Projects.reset(data.projects);
        });
    return channel('workspace-list-request').publish({});
    };

    WorkspaceView.prototype.render = function() {
      var p;
      return this.$().html(this.template({
names: (function() {
        var _i, _len, _ref, _results;
        _ref = RIDE.projects;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        p = _ref[_i];
        _results.push(p.name);
        }
        return _results;
        })()
}));
};

WorkspaceView.prototype.openProject = function() {
  return window.location = "/project/" + this.innerHTML + "/";
};

WorkspaceView.prototype.newProject = function() {
  var name;
  name = window.prompt('Please enter the name of your new project');
  if (name != null) {
    if (/^\W+$/.test(name)) {
      return channel('workspace-list-add').publish({
          'name': name
          });
    } else {
      return humane.error("The name '" + name + "' is invalid");
    }
  }
};

WorkspaceView.prototype.introspectProject = function() {
  channel('introspect-nodes-resp').subscribe(function(data) {
      return window.location = '/project/introspect';
      });
  return channel('introspect-nodes').publish();
};

return WorkspaceView;

})();
<div class="mac-button newproject">Create a new project</div>
<div class="mac-button introspect">Load running project</div>
<% _.each(names, function(name){ %>
    <div class="project"><span class="project-link"><%= name %></span></div>
    <% }); %>
<% if(names.length == 0) %>
<div class="noproject">No Projects yet</div>

<div class="mac-button introspect">Load running project</div>
<% _.each(names, function(name){ %>
    <div class="project"><span class="project-link"><%= name %></span></div>
    <% }); %>
<% if(names.length == 0) %>
<div class="noproject">No Projects yet</div>

