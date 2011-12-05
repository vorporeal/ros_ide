function DraggingTool(doc) {
	this.doc = doc;
	this.sel = [];
	this.positions = [];
	this.startX = 0;
	this.startY = 0;
}

DraggingTool.prototype.mousePressed = function(x, y) {
	this.sel = this.doc.getSelection();

	// Did we click on the existing selection?
	var draggingExistingSelection = false;
	for (var i = 0; i < this.sel.length; i++) {
		if (this.sel[i].rect.contains(x, y)) {
			draggingExistingSelection = true;
			break;
		}
	}

	// Drag the existing selection or a single unselected node
	if (!draggingExistingSelection) {
		this.sel = this.doc.getNodesInRect(new Rect(x, y, 0, 0));
		if (this.sel.length == 0) {
			// We didn't click on a node, let another tool handle this click
			return false;
		} else if (this.sel.length > 1) {
			// If we've clicked on more than one node, just pick one so we can drag overlapping nodes apart
			this.sel = [this.sel[this.sel.length - 1]];
		}
		this.doc.setSelection(this.sel);
	}

	// Calculate the minimum allowed mouse coordinate so the nodes don't get dragged offscreen
	this.minX = Number.MAX_VALUE;
	this.minY = Number.MAX_VALUE;
	for (var i = 0; i < this.sel.length; i++) {
		var rect = this.sel[i].rect;
		this.minX = Math.min(this.minX, rect.left);
		this.minY = Math.min(this.minY, rect.top);
	}
	this.minX = 30 + x - this.minX;
	this.minY = 30 + y - this.minY;
	
	this.startX = x;
	this.startY = y;
	this.positions = [];
	for (var i = 0; i < this.sel.length; i++) {
		this.positions.push({
			x: this.sel[i].x,
			y: this.sel[i].y
		});
	}

	// We might not have gotten a mouseup, so end any previous operation now
	this.doc.undoStack.endAllBatches();
	return true;
};

DraggingTool.prototype.mouseDragged = function(x, y) {
	x = Math.max(x, this.minX);
	y = Math.max(y, this.minY);
	for (var i = 0; i < this.sel.length; i++) {
		var node = this.sel[i];
		var pos = this.positions[i];
		node.x = pos.x + x - this.startX;
		node.y = pos.y + y - this.startY;
		node.updateRects();
	}
	editor.draw();
};

DraggingTool.prototype.mouseReleased = function(x, y) {
	x = Math.max(x, this.minX);
	y = Math.max(y, this.minY);
	this.doc.undoStack.beginBatch();
	for (var i = 0; i < this.sel.length; i++) {
		var node = this.sel[i];
		var pos = this.positions[i];
		node.x = pos.x;
		node.y = pos.y;
		this.doc.updateNode(node, 'x', pos.x + x - this.startX);
		this.doc.updateNode(node, 'y', pos.y + y - this.startY);
	}
	this.doc.undoStack.endBatch();
};

function NodeLinkTool(doc) {
	this.doc = doc;
	this.output = null;
	this.element = document.createElement('canvas');
	this.element.className = 'nodelink';
	this.c = this.element.getContext('2d');
	document.body.appendChild(this.element);
}

NodeLinkTool.prototype.updateElement = function(x, y) {
	var input = this.getInputFromPoint(x, y);
	var startX = this.output.rect.centerX;
	var startY = this.output.rect.centerY;
	var endX = input != null ? input.rect.left - 8 : x;
	var endY = input != null ? input.rect.centerY : y;

	var padding = 30;
	var left = Math.min(startX, endX) - padding;
	var top = Math.min(startY, endY) - padding;
	var right = Math.max(startX, endX) + padding;
	var bottom = Math.max(startY, endY) + padding;

	this.element.style.left = left + 'px';
	this.element.style.top = top + 'px';
	this.element.width = right - left;
	this.element.height = bottom - top;

	var ax = startX - left, ay = startY - top;
	var bx = endX - left, by = endY - top;
	var offset = 100;
	var c = this.c;

	drawLink(c, ax, ay, bx, by);
};

NodeLinkTool.prototype.getInputFromPoint = function(x, y) {
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		for (var j = 0; j < node.inputs.length; j++) {
			var input = node.inputs[j];
			if (input.rect.contains(x, y)) {
				return input;
			}
		}
	}
	return null;
};

NodeLinkTool.prototype.getOutputFromPoint = function(x, y) {
	var nodes = this.doc.getNodes();
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		for (var j = 0; j < node.outputs.length; j++) {
			var output = node.outputs[j];
			if (output.rect.contains(x, y)) {
				return output;
			}
		}
	}
	return null;
};

NodeLinkTool.prototype.mousePressed = function(x, y) {
	// See if we are starting to drag a new link
	this.output = this.getOutputFromPoint(x, y);

	// Otherwise see if we are disconnecting an existing link
	if (this.output == null) {
		var input = this.getInputFromPoint(x, y);
		if (input != null && input.connections.length > 0) {
			this.output = input.connections[0];
			this.doc.removeConnection(input, this.output);
			editor.draw();
		}
	}

	// Manipulate the link if we have one
	if (this.output != null) {
		this.doc.setSelection([]);
		this.updateElement(x, y);
		this.element.style.display = 'block';
		return true;
	}

	return false;
};

NodeLinkTool.prototype.mouseDragged = function(x, y) {
	this.updateElement(x, y);
};

NodeLinkTool.prototype.mouseReleased = function(x, y) {
	this.element.style.display = 'none';

	var input = this.getInputFromPoint(x, y);
	if (input != null) {
		this.doc.addConnection(input, this.output);
		editor.draw();
	}
};

function PopupTool(doc) {
	this.doc = doc;
}

PopupTool.prototype.mousePressed = function(x, y) {
	var nodes = this.doc.rawDoc.nodes;
	
	// don't lose focus from visible popups
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (node.popup.isVisible && Rect.getFromElement(node.popup.element, false).contains(x, y)) {
			return true;
		}
	}

	// show at most one popup, and stop other tools if a popup is shown
	var hitEditRect = false;
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		if (!hitEditRect && node.editRect.contains(x, y)) {
			hitEditRect = true;
			node.showPopup();
		} else {
			node.hidePopup();
		}
	}

	return hitEditRect;
};

PopupTool.prototype.mouseDragged = function(x, y) {
};

PopupTool.prototype.mouseReleased = function(x, y) {
};

function SelectionTool(doc) {
	this.doc = doc;
	this.startX = 0;
	this.startY = 0;
	this.element = document.createElement('div');
	this.element.className = 'selectionbox';
	document.body.appendChild(this.element);
}

SelectionTool.prototype.updateElement = function(endX, endY) {
	var left = Math.min(this.startX, endX);
	var top = Math.min(this.startY, endY);
	var right = Math.max(this.startX, endX);
	var bottom = Math.max(this.startY, endY);
	this.element.style.left = left + 'px';
	this.element.style.top = top + 'px';
	this.element.style.width = (right - left) + 'px';
	this.element.style.height = (bottom - top) + 'px';
	this.doc.setSelection(this.doc.getNodesInRect(new Rect(left, top, right - left, bottom - top)));
};

SelectionTool.prototype.mousePressed = function(x, y) {
	this.startX = x;
	this.startY = y;
	this.element.style.display = 'block';
	this.updateElement(x, y);
	this.doc.undoStack.endAllBatches();
	this.doc.undoStack.beginBatch();
	return true;
};

SelectionTool.prototype.mouseDragged = function(x, y) {
	this.updateElement(x, y);
};

SelectionTool.prototype.mouseReleased = function(x, y) {
	this.element.style.display = 'none';
	this.doc.undoStack.endBatch();
};

// Document handles undo using a RawDocument as backing
function RawDocument() {
	this.nodes = [];
	this.sel = [];
}

RawDocument.prototype.fromJSON = function(json) {
	this.nodes = json.nodes.map(function(n) {
		return new Node().fromJSON(n);
	});
	this.sel = [];
	for (var i = 0; i < this.nodes.length; i++) {
		this.nodes[i].createElement();
	}
	return this;
};

RawDocument.prototype.toJSON = function() {
	return {
		nodes: this.nodes.map(function(n) {
			return node.toJSON();
		})
	};
};

RawDocument.prototype.addNode = function(node) {
	this.nodes.push(node);
	node.createElement();

	channel('project-'+projectName+'-node-add').publish(node.toJSON());
};

RawDocument.prototype.removeNode = function(node) {
	// remove links
	for (var i = 0; i < node.inputs.length; i++) {
		var input = node.inputs[i];
		while (input.connections.length) {
			input.connections[0].disconnectFrom(input);
		}
	}
	for (var i = 0; i < node.outputs.length; i++) {
		var output = node.outputs[i];
		while (output.connections.length) {
			output.disconnectFrom(output.connections[0]);
		}
	}

	this.sel.removeOnce(node);
	this.nodes.removeOnce(node);
	node.deleteElement();

	channel('project-'+projectName+'-node-remove').publish({
		id: node.id
	});
};

RawDocument.prototype.updateNode = function(node, name, value) {
	node.update(name, value);

	// Only send the property that changed, not the whole node
	var json = { id: node.id };
	json[name] = value;
	channel('project-'+projectName+'-node-update').publish(json);
};

RawDocument.prototype.setSelection = function(sel) {
	for (var i = 0; i < this.nodes.length; i++) {
		this.nodes[i].element.className = 'node';
	}
	for (var i = 0; i < sel.length; i++) {
		sel[i].element.className = 'selected node';
	}
	this.sel = sel;
};

RawDocument.prototype.addConnection = function(input, output) {
	input.connectTo(output);
	channel('project-'+projectName+'-node-connect').publish({
		input: input.id,
		output: output.id
	});
};

RawDocument.prototype.removeConnection = function(input, output) {
	input.disconnectFrom(output);
	channel('project-'+projectName+'-node-disconnect').publish({
		input: input.id,
		output: output.id
	});
};

function Node() {
	this.x = 0;
	this.y = 0;
	this.id = 0;
	this.name = '';
	this.inputs = [];
	this.outputs = [];
	this.rect = null;
	this.editRect = null;
	this.element = null;
	this.extras = {};
}

Node.prototype.fromJSON = function(json) {
	this.x = json.x;
	this.y = json.y;
	this.id = json.id;
	this.name = json.name;
	this.inputs = json.inputs.map(function(i) {
		return new Connection(this).fromJSON(i);
	});
	this.outputs = json.outputs.map(function(i) {
		return new Connection(this).fromJSON(i);
	});
	this.extras = {};
	for (var x in json) {
		if (!(x in this)) {
			this.extras[x] = json[x];
		}
	}
	return this;
};

Node.prototype.toJSON = function() {
	var json = {
		x: this.x,
		y: this.y,
		id: this.id,
		name: this.name,
		inputs: this.inputs.map(function(i) {
			return i.toJSON();
		}),
		outputs: this.outputs.map(function(o) {
			return o.toJSON();
		})
	};
	for (var x in this.extras) {
		json[x] = this.extras[x];
	}
	return json;
};

Node.prototype.update = function(name, value) {
	if (this[name] !== value) {
		this[name] = value;
		this.generateHTML();
		this.updateRects();
		this.hidePopup();
	}
};

Node.prototype.generatePopupHTML = function() {
	var properties = [ 'name', 'pkg', 'exec' ];
	var labels = [ 'Name', 'Package', 'Executable' ];
	var html = '';
	html += '<table>';
	for (var i = 0; i < properties.length; i++) {
		var name = properties[i];
		var id = 'node' + this.id + '-prop' + i;
		html += '<tr><td>' + labels[i] + ':</td><td><input type="text" id="' + id + '" value="' + ((name in this ? this[name] : this.extras[name]) + '').toHTML() + '"></td></tr>';
	}
	html += '</table>';
	return html;
};

Node.prototype.bindPopupCallbacks = function() {
	// var this_ = this;
	// $('#node' + this.id + '-prop0').bind('input', function(e) {
	// 	editor.doc.updateNode(this_, 'name', e.target.value);
	// });
	// $('#node' + this.id + '-prop1').bind('input', function(e) {
	// 	editor.doc.updateNode(this_, 'pkg', e.target.value);
	// });
	// $('#node' + this.id + '-prop2').bind('input', function(e) {
	// 	editor.doc.updateNode(this_, 'exec', e.target.value);
	// });
};

Node.prototype.createElement = function() {
	this.element = document.createElement('div');
	this.element.className = 'node';
	document.body.appendChild(this.element);

	this.popup = new Popup().setDirection('right');
	this.generateHTML();
	this.updateRects();
};

Node.prototype.deleteElement = function() {
	this.element.parentNode.removeChild(this.element);
	this.element = null;

	this.popup.deleteElement();
	this.popup = null;
};

Node.prototype.updateRects = function() {
	this.element.style.left = this.x + 'px';
	this.element.style.top = this.y + 'px';

	this.rect = Rect.getFromElement(this.element, true);
	this.editRect = new Rect(0, 0, 0, 0);//Rect.getFromElement($(this.element).find('.edit-link span')[0], false);

	for (var i = 0; i < this.inputs.length; i++) {
		var input = this.inputs[i];
		input.rect = Rect.getFromElement(input.element, false);
	}
	
	for (var i = 0; i < this.outputs.length; i++) {
		var output = this.outputs[i];
		output.rect = Rect.getFromElement(output.element, false);
	}

	this.popup.setAnchor(this.editRect.right + 3, this.editRect.centerY);
};

Node.prototype.generateHTML = function() {
	var this_ = this;
	var html = '<table><tr><td class="title">' + this.name + '</td>' + /*'<td class="edit-link"><span>edit</span></td>' +*/ '</tr></table>';
	html += '<table><tr><td>';

	// inputs to html
	for (var i = 0; i < this.inputs.length; i++) {
		html += '<div class="input"><div class="bullet" id="node' + this.id + '-input' + i + '">';
		html += '<div></div></div>&nbsp;' + this.inputs[i].name.toHTML() + '</div>';
	}

	html += '</td><td>';

	// outputs to html
	for (var i = 0; i < this.outputs.length; i++) {
		html += '<div class="output">' + this.outputs[i].name.toHTML() + '&nbsp;';
		html += '<div class="bullet" id="node' + this.id + '-output' + i + '"><div></div></div></div>';
	}

	// change html
	html += '</td></tr></table>';
	this.element.innerHTML = html;

	// reset all input elements
	for (var i = 0; i < this.inputs.length; i++) {
		this.inputs[i].element = document.getElementById('node' + this.id + '-input' + i);
	}

	// reset all output elements
	for (var i = 0; i < this.outputs.length; i++) {
		this.outputs[i].element = document.getElementById('node' + this.id + '-output' + i);
	}
	
	this.updateRects();
};

Node.prototype.showPopup = function() {
	this.popup.setHTML(this.generatePopupHTML());
	this.popup.show();
	this.bindPopupCallbacks();
};

Node.prototype.hidePopup = function() {
	this.popup.hide();
};

////////////////////////////////////////////////////////////////////////////////

function AddNodeCommand(doc, node) {
	this.doc = doc;
	this.node = node;
}

AddNodeCommand.prototype.undo = function() {
	this.doc.removeNode(this.node);
};

AddNodeCommand.prototype.redo = function() {
	this.doc.addNode(this.node);
};

AddNodeCommand.prototype.mergeWith = function(command) {
	return false;
};

////////////////////////////////////////////////////////////////////////////////

function RemoveNodeCommand(doc, node) {
	this.doc = doc;
	this.node = node;
}

RemoveNodeCommand.prototype.undo = function() {
	this.doc.addNode(this.node);
};

RemoveNodeCommand.prototype.redo = function() {
	this.doc.removeNode(this.node);
};

RemoveNodeCommand.prototype.mergeWith = function(command) {
	return false;
};

////////////////////////////////////////////////////////////////////////////////

function UpdateNodeCommand(doc, node, name, value) {
	this.doc = doc;
	this.node = node;
	this.name = name;
	this.oldValue = node[name];
	this.newValue = value;
}

UpdateNodeCommand.prototype.undo = function() {
	this.doc.updateNode(this.node, this.name, this.oldValue);
	this.node[this.name] = this.oldValue;
};

UpdateNodeCommand.prototype.redo = function() {
	this.doc.updateNode(this.node, this.name, this.newValue);
};

UpdateNodeCommand.prototype.mergeWith = function(command) {
	if (command instanceof UpdateNodeCommand && this.name === command.name && this.newValue === command.oldValue) {
		this.newValue = command.newValue;
		return true;
	}
	return false;
};

////////////////////////////////////////////////////////////////////////////////

function SetSelectionCommand(doc, sel) {
	this.doc = doc;
	this.oldSel = doc.sel;
	this.newSel = sel;
}

SetSelectionCommand.prototype.undo = function() {
	this.doc.setSelection(this.oldSel);
};

SetSelectionCommand.prototype.redo = function() {
	this.doc.setSelection(this.newSel);
};

SetSelectionCommand.prototype.mergeWith = function(command) {
	if (command instanceof SetSelectionCommand) {
		this.newSel = command.newSel;
		return true;
	}
	return false;
};

////////////////////////////////////////////////////////////////////////////////

function AddConnectionCommand(doc, input, output) {
	this.doc = doc;
	this.input = input;
	this.output = output;
}

AddConnectionCommand.prototype.undo = function() {
	this.doc.removeConnection(this.input, this.output);
};

AddConnectionCommand.prototype.redo = function() {
	this.doc.addConnection(this.input, this.output);
};

AddConnectionCommand.prototype.mergeWith = function(command) {
	return false;
};

////////////////////////////////////////////////////////////////////////////////

function RemoveConnectionCommand(doc, input, output) {
	this.doc = doc;
	this.input = input;
	this.output = output;
}

RemoveConnectionCommand.prototype.undo = function() {
	this.doc.addConnection(this.input, this.output);
};

RemoveConnectionCommand.prototype.redo = function() {
	this.doc.removeConnection(this.input, this.output);
};

RemoveConnectionCommand.prototype.mergeWith = function(command) {
	return false;
};

function Document() {
	this.rawDoc = new RawDocument();
	this.undoStack = new UndoStack();
}

Document.prototype.getNodes = function() {
	return this.rawDoc.nodes;
};

Document.prototype.getSelection = function() {
	return this.rawDoc.sel;
};

Document.prototype.fromJSON = function(json) {
	var nodes = json.nodes.map(function(n) {
		return new Node().fromJSON(n);
	});

	var connections = {};
	nodes.map(function(node) {
		node.createElement();
		node.inputs.map(function(input) {
			connections[input.id] = input;
		});
		node.outputs.map(function(output) {
			connections[output.id] = output;
		});
	});
	nodes.map(function(node) {
		node.inputs.map(function(input) {
			input._json_ids.map(function(id) {
				input.connectTo(connections[id]);
			});
		});
		node.outputs.map(function(output) {
			output._json_ids.map(function(id) {
				output.connectTo(connections[id]);
			});
		});
	});

	this.rawDoc.nodes = nodes;
	this.rawDoc.sel = [];
	this.undoStack = new UndoStack();
};

Document.prototype.getNodesInRect = function(rect) {
	var nodes = [];
	for (var i = 0; i < this.rawDoc.nodes.length; i++) {
		var node = this.rawDoc.nodes[i];
		if (node.rect.intersects(rect)) {
			nodes.push(node);
		}
	}
	return nodes;
};

Document.prototype.addNode = function(node) {
	this.undoStack.push(new AddNodeCommand(this.rawDoc, node));
};

Document.prototype.removeNode = function(node) {
	this.undoStack.beginBatch();

	// disconnect all inputs
	for (var i = 0; i < node.inputs.length; i++) {
		var input = node.inputs[i];
		while (input.connections.length) {
			this.removeConnection(input, input.connections[0]);
		}
	}

	// disconnect all outputs
	for (var i = 0; i < node.outputs.length; i++) {
		var output = node.outputs[i];
		while (output.connections.length) {
			this.removeConnection(output.connections[0], output);
		}
	}

	this.undoStack.push(new RemoveNodeCommand(this.rawDoc, node));
	this.undoStack.endBatch();
};

Document.prototype.updateNode = function(node, name, value) {
	if (node[name] !== value) {
		this.undoStack.push(new UpdateNodeCommand(this.rawDoc, node, name, value));
	}
};

Document.prototype.setSelection = function(sel) {
	// only change the selection if it's different
	var different = false;
	if (sel.length != this.rawDoc.sel.length) {
		different = true;
	} else {
		function compareNodes(a, b) { return a.id - b.id; }
		sel.sort(compareNodes);
		this.rawDoc.sel.sort(compareNodes);
		for (var i = 0; i < sel.length; i++) {
			if (sel[i] != this.rawDoc.sel[i]) {
				different = true;
				break;
			}
		}
	}
	
	if (different) this.undoStack.push(new SetSelectionCommand(this.rawDoc, sel));
};

Document.prototype.deleteSelection = function() {
	while (this.rawDoc.sel.length > 0) {
		this.removeNode(this.rawDoc.sel[0]);
	}
};

Document.prototype.addConnection = function(input, output) {
	// only add the connection if needed
	if (!input.connections.contains(output)) {
		this.undoStack.push(new AddConnectionCommand(this.rawDoc, input, output));
	}
};

Document.prototype.removeConnection = function(input, output) {
	// only remove the connection if needed
	if (input.connections.contains(output)) {
		this.undoStack.push(new RemoveConnectionCommand(this.rawDoc, input, output));
	}
};

function Connection(parent) {
	this.parent = parent;
	this.name = '';
	this.id = 0;
	this.connections = [];
	this.element = null;
	this.rect = null;
}

Connection.prototype.fromJSON = function(json) {
	this.name = json.name;
	this.id = json.id;
	this._json_ids = json.connections; // will be remapped from list of ids to list of Connection objects after this
	this.connections = [];
	return this;
};

Connection.prototype.toJSON = function() {
	return {
		id: this.id,
		name: this.name,
		connections: this.connections.map(function(c) {
			return c.id;
		})
	};
};

Connection.prototype.connectTo = function(other) {
  if(!other)
  {
    console.log("Attempted to connect to undefined node");
    return;
  }
	this.connections.addOnce(other);
	other.connections.addOnce(this);
};

Connection.prototype.disconnectFrom = function(other) {
	this.connections.removeAll(other);
	other.connections.removeAll(this);
};

////////////////////////////////////////////////////////////////////////////////
// class BatchCommand
//
// This is a group of commands that are all undone and redone at once.  For
// example, most text editors group adjacent character insert commands so that
// when you undo, the entire run of character insertions is done at once.
////////////////////////////////////////////////////////////////////////////////

function BatchCommand() {
	this.commands = [];
}

BatchCommand.prototype.undo = function() {
	for (var i = this.commands.length - 1; i >= 0; i--) {
		this.commands[i].undo();
	}
};

BatchCommand.prototype.redo = function() {
	for (var i = 0; i < this.commands.length; i++) {
		this.commands[i].redo();
	}
};

////////////////////////////////////////////////////////////////////////////////
// class UndoStack
//
// This class is based off QUndoStack from the Qt framework:
// http://doc.qt.nokia.com/stable/qundostack.html
////////////////////////////////////////////////////////////////////////////////

function UndoStack() {
	this.batches = [];
	this.commands = [];
	this.currentIndex = 0;
	this.cleanIndex = 0;
}

UndoStack.prototype._push = function(command) {
	// Only push the batch if it's non-empty, otherwise it leads to weird behavior
	if (command instanceof BatchCommand && command.commands.length == 0) {
		return;
	}
	
	if (this.batches.length == 0) {
		// Remove all commands after our position in the undo buffer (these are
		// ones we have undone, and once we do something else we shouldn't be able
		// to redo these anymore)
		this.commands = this.commands.slice(0, this.currentIndex);
		
		// If we got to the current position by undoing from a clean state, set
		// the clean state to invalid because we won't be able to get there again
		if (this.cleanIndex > this.currentIndex) this.cleanIndex = -1;
		
		this.commands.push(command);
		this.currentIndex++;
	} else {
		// Merge adjacent commands together in the same batch by calling mergeWith()
		// on the previous command and passing it the next command.  If it returns
		// true, the information from the next command has been merged with the
		// previous command and we can forget about the next command (so we return
		// instead of pushing it).
		var commands = this.batches[this.batches.length - 1].commands;
		if (commands.length > 0 && commands[commands.length - 1].mergeWith(command)) {
			return;
		}
		
		commands.push(command);
	}
};

UndoStack.prototype.push = function(command) {
	this._push(command);
	command.redo();
};

UndoStack.prototype.canUndo = function() {
	return this.batches.length == 0 && this.currentIndex > 0;
};

UndoStack.prototype.canRedo = function() {
	return this.batches.length == 0 && this.currentIndex < this.commands.length;
};

UndoStack.prototype.beginBatch = function() {
	this.batches.push(new BatchCommand());
};

UndoStack.prototype.endBatch = function() {
	if (this.batches.length > 0) this._push(this.batches.pop());
};

UndoStack.prototype.endAllBatches = function() {
	while (this.batches.length > 0) this.endBatch();
};

UndoStack.prototype.undo = function() {
	if (this.canUndo()) this.commands[--this.currentIndex].undo();
};

UndoStack.prototype.redo = function() {
	if (this.canRedo()) this.commands[this.currentIndex++].redo();
};

UndoStack.prototype.getCurrentIndex = function() {
	return this.currentIndex;
};

UndoStack.prototype.setCleanIndex = function(index) {
	this.cleanIndex = index;
};

UndoStack.prototype.clear = function() {
	this.batches = [];
	this.commands = [];
	this.currentIndex = this.cleanIndex = 0;
};

function Rect(left, top, width, height) {
	this.left = left;
	this.top = top;
	this.width = width;
	this.height = height;
	this.right = left + width;
	this.bottom = top + height;
	this.centerX = left + width / 2;
	this.centerY = top + height / 2;
}

Rect.getFromElement = function(element, noMargin) {
	var e = $(element);
	var offset = e.offset();
	return new Rect(
		offset.left - noMargin * parseInt(e.css('marginLeft'), 10),
		offset.top - noMargin * parseInt(e.css('marginTop'), 10),
		e.innerWidth(),
		e.innerHeight()
	);
};

Rect.prototype.contains = function(x, y) {
	return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
};

Rect.prototype.intersects = function(rect) {
	return this.right > rect.left && rect.right > this.left && this.bottom > rect.top && rect.bottom > this.top;
};

String.prototype.toHTML = function() {
	return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

Array.prototype.contains = function(element) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === element) {
			return true;
		}
	}
	return false;
};

Array.prototype.map = function(func) {
	var result = [];
	for (var i = 0; i < this.length; i++) {
		result.push(func(this[i]));
	}
	return result;
};

Array.prototype.addOnce = function(element) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === element) {
			return;
		}
	}
	this.push(element);
};

Array.prototype.removeAll = function(element) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === element) {
			this.splice(i--, 1);
		}
	}
};

Array.prototype.removeOnce = function(element) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] === element) {
			this.splice(i, 1);
			return;
		}
	}
};

function drawLink(c, ax, ay, bx, by) {
	c.strokeStyle = 'yellow';
	c.fillStyle = 'yellow';
	c.lineWidth = 2;
	c.shadowBlur = 3;
	c.shadowColor = 'black';
	c.shadowOffsetY = 1;

	c.beginPath();
	c.moveTo(ax, ay);
	c.bezierCurveTo(ax + 100, ay, bx - 90, by, bx, by);
	c.stroke();

	// Draw arrow head
	var t = 0.95, invT = 1 - t;
	var t0 = invT * invT * invT;
	var t1 = invT * invT * t * 3;
	var t2 = invT * t * t * 3;
	var t3 = t * t * t;
	var x = t0 * ax + t1 * (ax + 100) + t2 * (bx - 100) + t3 * bx;
	var y = t0 * ay + t1 * ay + t2 * by + t3 * by;
	var angle = Math.atan2(by - y, bx - x);
	var sin = Math.sin(angle);
	var cos = Math.cos(angle);
	c.beginPath();
	c.moveTo(bx, by);
	c.lineTo(bx - 10 * cos - 5 * sin, by - 10 * sin + 5 * cos);
	c.lineTo(bx - 10 * cos + 5 * sin, by - 10 * sin - 5 * cos);
	c.fill();
}

var editor;
var projectName;

$(window).load(function() {
	var context = $('#canvas')[0].getContext('2d');
	editor = new Editor(context);

	// need to preventDefault() here instead of mousedown because we
	// still want mousedown to move keyboard focus into the iframe
	$(document).bind('selectstart', function(e) {
		e.preventDefault();
	});

	$(document).mousedown(function(e) {
		editor.mousePressed(e.pageX, e.pageY);
	});

	$(document).mousemove(function(e) {
		editor.mouseMoved(e.pageX, e.pageY);
		e.preventDefault();
	});

	$(document).mouseup(function(e) {
		editor.mouseReleased(e.pageX, e.pageY);
		e.preventDefault();
	});

	var focusCount = 0;
	$('input').live('focus', function() { focusCount++; });
	$('input').live('blur', function() { focusCount--; });

	$(document).keydown(function(e) {
		// disable keyboard shortcuts inside input elements
		if (focusCount > 0) {
			return;
		}

		if ((e.ctrlKey || e.metaKey) && e.which == 'Z'.charCodeAt(0)) {
			if (e.shiftKey) editor.redo();
			else editor.undo();
			e.preventDefault();
		} else if ((e.ctrlKey || e.metaKey) && e.which == 'A'.charCodeAt(0)) {
			editor.selectAll();
			e.preventDefault();
		} else if (e.which == '\b'.charCodeAt(0)) {
			editor.deleteSelection();
			e.preventDefault();
		}
	});

	$(window).resize(function() {
		editor.draw();
	});
});

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
