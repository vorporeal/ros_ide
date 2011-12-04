function NodeGroup(){
  this.id = null;
  this.nodes = [];
}

NodeGroup.prototype.fromJSON = function(json) {
  this.id = json.id;
  this.nodes = json.nodes;
}

NodeGroup.prototype.toJSON = function(){
  return {'id': this.id, 'nodes': this.nodes};
}

NodeGroup.prototype.group = function(){

