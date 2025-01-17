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
