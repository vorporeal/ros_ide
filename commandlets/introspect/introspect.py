#!/usr/bin/env python

import sys
import socket
import json

from ros import rosnode
from ros import rosgraph
from rosgraph import masterapi

# Get the type of a given topic.
def topic_type(t, pub_topics):
        matches = [t_type for t_name, t_type in pub_topics if t_name == t]
        if matches:
            return matches[0]
        return None

if __name__ == '__main__':
    # Get the names of the running nodes.
    nodes = rosnode.get_node_names()

    # Get a reference to the ROS master.
    master = masterapi.Master('/ride_introspect')

    # Get the "node state" of the system.
    state = None
    pub_topics = None
    try:
        state = master.getSystemState()
        pub_topics = master.getPublishedTopics('')
    except socket.error:
        raise ROSNodeIOException("Unable to communicate with master!")

    # Grab the pub/sub/srv information from the nodes (along with type info),
    # put it in a nice structure, and print a JSON-formatted version.
    data = {'nodes': []}
    for n in nodes:
        name = n.rsplit('/', 1)[1]

        outputs = [{'name': t.rsplit('/', 1)[1], 'id': t, 'type': topic_type(t, pub_topics), 'connections': []} for t, l in state[0] + state[2] if n in l]
        inputs = [{'name': t.rsplit('/', 1)[1], 'id': t, 'type': topic_type(t, pub_topics), 'connections': []} for t, l in state[1] if n in l]
        
        data['nodes'].append({'name':name, 'id':n, 'outputs':outputs, 'inputs':inputs})

    print(json.dumps(data))
