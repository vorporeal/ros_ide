(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  window.RIDE = {};
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
  RIDE.ProjectView = (function() {
    __extends(ProjectView, Backbone.View);
    function ProjectView() {
      this.render = __bind(this.render, this);
      ProjectView.__super__.constructor.apply(this, arguments);
    }
    ProjectView.prototype.template = _.template('<div class="project"><span class="project-link"><a href="/project/<%= name %>"><%= name %></a></span></div>');
    ProjectView.prototype.render = function() {
      $(this.el).html(this.template({
        'name': this.model.get('name')
      }));
      return this;
    };
    return ProjectView;
  })();
  RIDE.WorkspaceView = (function() {
    __extends(WorkspaceView, Backbone.View);
    function WorkspaceView() {
      this.addAll = __bind(this.addAll, this);
      this.addOne = __bind(this.addOne, this);
      this.render = __bind(this.render, this);
      WorkspaceView.__super__.constructor.apply(this, arguments);
    }
    WorkspaceView.prototype.events = {
      "click .newproject": "newProject",
      "click .introspect": "introspectProject"
    };
    WorkspaceView.prototype.initialize = function() {
      this.template = JST.workspace;
      this.el = $('#workspace');
      RIDE.projects = new RIDE.ProjectsCollection;
      RIDE.projects.bind('all', this.render);
      RIDE.projects.bind('add', this.addOne);
      RIDE.projects.bind('reset', this.addAll);
      channel('workspace-list-response').subscribe(function(data) {
        return RIDE.projects.reset(data.projects);
      });
      return channel('workspace-list-request').publish({});
    };
    WorkspaceView.prototype.render = function() {
      this.$('div#loading').remove();
      this.$('div.noproject').remove();
      if (RIDE.projects.length === 0) {
        return $(this.el).append('<div class="noproject">No projects yet!</div>');
      }
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
    WorkspaceView.prototype.addOne = function(project) {
      var view;
      view = new RIDE.ProjectView({
        model: project
      });
      this.$('#list').append(view.render().el);
      return true;
    };
    WorkspaceView.prototype.addAll = function() {
      this.$('#list').empty();
      RIDE.projects.each(this.addOne);
      return true;
    };
    return WorkspaceView;
  })();
}).call(this);
