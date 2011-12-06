function iframeLoaded()
{
    // Get the editor component from the iframe.
    RIDE.editor = $('iframe')[0].contentWindow.RIDE.editor;
    $('iframe').focus();
    RIDE.editor.setProjectName(RIDE.projectName);
}

$(window).load(function() {

    // Set the global project name.
    RIDE.projectName = /^\/project\/(\w+)\/?$/.exec(location.pathname)[1];

    // Set up the node editor component.
    iframeLoaded();

    // Set up the dropdown menu in the navigation bar.
    $('#nav-project-toggle').html(RIDE.projectName);
    $('.dropdown').dropdown();

    // Set up the library modal dialog.
    $('#library-modal').modal({backdrop: true, keyboard: true});

    // SET UP EVENTS
    ////////////////

    // Make the library close when "Cancel" is clicked.
    $('#library-cancel-btn').click(function() {
        $('#library-modal').modal('hide');
    });

    // Process events related to "saving" the project (ride2ros).
    channel('project-' + RIDE.projectName + '-save-status').subscribe(function(err) {
        if(err)
            humane.error(err);
        else
            humane.success('roslaunch file created successfully!');
        humane.forceNew = false;
    });
    $('#nav-save-btn').click(function() {
        humane.forceNew = true;
        humane.log('saving...');
        window.setTimeout(function() {
            channel('project-' + RIDE.projectName + '-save').publish({})
        }, 1000);
    });

    ////////////////
    //
});

// Old project javascript code, shouldn't need much (if any) of this anymore.
/**

function text2html(text) {
	return ('' + text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>').replace(/  /g, '&nbsp; ');
}

$(window).load(function() {
	var editor = $('iframe')[0].contentWindow.editor;
	$('iframe').focus();

	// tell the iframe about the project url
	var projectName = /^\/project\/(\w+)\/?$/.exec(location.pathname)[1];
	editor.setProjectName(projectName);

	// create the deploy status window
	var deployStatus = new HUD(document.body, 'Deploy Status');
	deployStatus.setButtons([
		new HUD.DefaultButton('Close', function() {
			deployStatus.hide();
		})
	]);
	var totalStatus = '';

	// create the toolbar buttons
	var contents = [
		new Toolbar.Button('Insert ROS Node', '/images/rosnode.png').click(function() {
			if (library.isVisible()) library.hide();
			else library.show();
			window.focus();
		}),
        new Toolbar.Button('Save', '/images/save.png').click(function() {
            channel('project-'+projectName+'-save').publish({});
        })
	];
	channel('project-'+projectName+'-deploy-status').subscribe(function(json) {
		totalStatus += text2html('\n' + json['text']);
		deployStatus.setContents([
			new HUD.Box(totalStatus)
		]);
	});

	// add the buttons to a toolbar
	var toolbar = new Toolbar();
	toolbar.setContents(contents);

	// position the editor below the toolbar
	function resize() {
		$('.editor').css({ top: toolbar.height() + 'px' });
	}
	$(window).resize(resize);
	resize();

	// create the node library
	var library = new Library(document.body, 'Node Library');
	var libraryJSON = { nodes: [] };
	library.setButtons([
		new Library.DefaultButton('Insert', function() {
			library.hide();
			var json = libraryJSON.nodes[library.selectionIndex];
			json.x = 100;
			json.y = 100;
			editor.insertNodeFromLibrary(json);
		}),
		new Library.Button('New Node', function() {
			newNode.show();
		}),
		new Library.Button('Cancel', function() {
			library.hide();
		})
	]);

	var newNode = new HUD(document.body, 'New Node');
	var newNodeName = '';
	var newNodePackage = '';
	var newNodeExecutable = '';
	var newNodeInputs = '';
	var newNodeOutputs = '';
	newNode.setContents([
		new HUD.Textbox('Name', newNodeName, function(textbox) {
			newNodeName = textbox.text;
		}),
		new HUD.Textbox('Package', newNodePackage, function(textbox) {
			newNodePackage = textbox.text;
		}),
		new HUD.Textbox('Executable', newNodeExecutable, function(textbox) {
			newNodeExecutable = textbox.text;
		}),
		new HUD.Textbox('Inputs (comma separated)', newNodeInputs, function(textbox) {
			newNodeInputs = textbox.text;
		}),
		new HUD.Textbox('Outputs (comma separated)', newNodeOutputs, function(textbox) {
			newNodeOutputs = textbox.text;
		})
	]);
	newNode.setButtons([
		new HUD.DefaultButton('Add', function() {
			libraryJSON.nodes.push({
				name: newNodeName,
				exec: newNodeExecutable,
				pkg: newNodePackage,
				inputs: newNodeInputs.split(/\s*,\s* /).map(function(name) {
					return { name: name };
				}),
				outputs: newNodeOutputs.split(/\s*,\s* /).map(function(name) {
					return { name: name };
				})
			});
			updateLibrary();
			newNode.hide();
		}),
		new HUD.Button('Cancel', function() {
			newNode.hide();
		})
	]);

	// populate the node library
	channel('workspace-library-response').subscribe(function(json) {
		libraryJSON = json;
		updateLibrary();
	});
	channel('workspace-library-request').publish({});

	function updateLibrary() {
		var contents = [];
		for (var i = 0; i < libraryJSON.nodes.length; i++) {
			var node = libraryJSON.nodes[i];
			var name = node.name;
			var path = node.pkg + '/' + (node.exec || node.launch);
			contents.push(new Library.Row('<div class="name">' + name + '</div><div class="path">' + path + '</div>'));
		}
		library.setContents(contents);
	}
});

**/