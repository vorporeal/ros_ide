function Editor(context) {
	var this_ = this;
	this.context = context;
	this.doc = new Document();
	this.tools = [
		// Listed in order of precedence
		new PopupTool(this.doc),
		new NodeLinkTool(this.doc),
		new DraggingTool(this.doc),
		new SelectionTool(this.doc)
	];
}

Editor.prototype.drawLinks = function() {
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		for (var j = 0; j < node.outputs.length; j++) {
			var output = node.outputs[j];
			for (var k = 0; k < output.connections.length; k++) {
				var input = output.connections[k];
				var ax = output.rect.centerX, ay = output.rect.centerY;
				var bx = input.rect.left - 8, by = input.rect.centerY;
				drawLink(this.context, ax, ay, bx, by);
			}
		}
	}
};

Editor.prototype.draw = function() {
	var canvas = this.context.canvas;
	var minSize = this.getMinSize();
	canvas.width = minSize.width;
	canvas.height = minSize.height;
	this.context.save();
	this.context.clearRect(0, 0, canvas.width, canvas.height);
	this.drawLinks();
	this.context.restore();
};

Editor.prototype.getMinSize = function() {
	var minSize = { width: 0, height: 0 };
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var rect = nodes[i].rect;
		minSize.width = Math.max(minSize.width, rect.right + 50);
		minSize.height = Math.max(minSize.height, rect.bottom + 50);
	}
	return minSize;
};

Editor.prototype.mousePressed = function(x, y) {
	this.tool = null;
	for (var i = 0; i < this.tools.length; i++) {
		var tool = this.tools[i];
		if (tool.mousePressed(x, y)) {
			this.tool = tool;
			break;
		}
	}
};

Editor.prototype.mouseMoved = function(x, y) {
	if (this.tool != null) {
		this.tool.mouseDragged(x, y);
	}
};

Editor.prototype.mouseReleased = function(x, y) {
	if (this.tool != null) {
		this.tool.mouseReleased(x, y);
		this.tool = null;
	}
};

Editor.prototype.selectAll = function() {
	this.doc.setSelection(this.doc.getNodes());
};

Editor.prototype.undo = function() {
	this.doc.undoStack.undo();
	this.draw();
};

Editor.prototype.redo = function() {
	this.doc.undoStack.redo();
	this.draw();
};

Editor.prototype.deleteSelection = function() {
	this.doc.deleteSelection();
	this.draw();
};

function newID() {
	return Math.random().toString().substr(2);
}

// this is meant to be called to insert a new node from the
// library, not an existing node from over the network
Editor.prototype.insertNodeFromLibrary = function(json) {
	json.id = newID();
	json.inputs.map(function(i) {
		i.id = newID();
	});
	json.outputs.map(function(i) {
		i.id = newID();
	});
	this.doc.addNode(new Node().fromJSON(json));
	this.draw();
};

Editor.prototype.onUpdateNodeMessage = function(json) {
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (node.id === json.id) {
			for (var name in json) {
				// Connections (inputs and outputs) aren't updated using the update channel
				// We also don't want to change the node id!
				if (name != 'id' && name != 'inputs' && name != 'outputs') {
					this.doc.updateNode(node, name, json[name]);
				}
			}
			break;
		}
	}
	this.draw();
};

Editor.prototype.onAddNodeMessage = function(json) {
	// don't add the node if it already exists
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		if (nodes[i].id === json.id) {
			return;
		}
	}

	this.doc.addNode(new Node().fromJSON(json));
	this.draw();
};

Editor.prototype.onRemoveNodeMessage = function(json) {
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (node.id === json.id) {
			this.doc.removeNode(node);
			this.draw();
			break;
		}
	}
};

function findInputAndOutput(nodes, json) {
	var input = null;
	var output = null;
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		for (var j = 0; j < node.inputs.length; j++) {
			if (node.inputs[j].id == json.input) {
				input = node.inputs[j];
			}
		}
		for (var j = 0; j < node.outputs.length; j++) {
			if (node.outputs[j].id == json.output) {
				output = node.outputs[j];
			}
		}
	}
	return {
		input: input,
		output: output
	};
}

Editor.prototype.onAddConnectionMessage = function(json) {
	var info = findInputAndOutput(this.doc.getNodes(), json);
	if (info.input && info.output) {
		this.doc.addConnection(info.input, info.output);
		this.draw();
	}
};

Editor.prototype.onRemoveConnectionMessage = function(json) {
	var info = findInputAndOutput(this.doc.getNodes(), json);
	if (info.input && info.output) {
		this.doc.removeConnection(info.input, info.output);
		this.draw();
	}
};

Editor.prototype.onSetNodesMessage = function(json) {
	this.doc.fromJSON(json);
	this.draw();
};

Editor.prototype.setProjectName = function(projectName) {
	window.projectName = projectName;

	// subscribe to node updates
	var this_ = this;
	var updateChannel = channel('project-'+projectName+'-node-update');
	updateChannel.subscribe(function(json) {
		updateChannel.disable();
		this_.onUpdateNodeMessage(json);
		updateChannel.enable();
	});
	channel('project-'+projectName+'-node-add').subscribe(function(json) {
		this_.onAddNodeMessage(json);
	});
	channel('project-'+projectName+'-node-remove').subscribe(function(json) {
		this_.onRemoveNodeMessage(json);
	});
	channel('project-'+projectName+'-node-connect').subscribe(function(json) {
		this_.onAddConnectionMessage(json);
	});
	channel('project-'+projectName+'-node-disconnect').subscribe(function(json) {
		this_.onRemoveConnectionMessage(json);
	});

	// poll until we get the node list
	var this_ = this;
	this.gotNodes = false;
	channel('project-'+projectName+'-nodes-response').subscribe(function(json) {
		if (!this_.gotNodes) {
			this_.onSetNodesMessage(json);
			this_.gotNodes = true;
			clearInterval(interval);
		}
	});
	var interval = setInterval(function() {
		channel('project-'+projectName+'-nodes-request').publish({});
	}, 100);
};
