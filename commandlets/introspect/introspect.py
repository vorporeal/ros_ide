#!/usr/bin/env python

import sys
import socket
import json

from ros import rosnode
import roslib.scriptutil as scriptutil

# A simple function to check for errors in calls to master and 
# either error out or return the appropriate value.
def _succeed(args):
    code, msg, val = args
    if code != 1:
        raise rosnode.ROSNodeException("remote call failed: %s"%msg)
    return val

# Get the type of a given topic.
def topic_type(t, pub_topics):
        matches = [t_type for t_name, t_type in pub_topics if t_name == t]
        if matches:
            return matches[0]
        return None

if __name__ == '__main__':
    # Get the names of the running nodes.
    nodes = rosnode.get_node_names()

    # Get a reference to the master ROS node.
    master = scriptutil.get_master()

    # Get the "node state" of the system.
    state = None
    pub_topics = None
    try:
        state = _succeed(master.getSystemState('/rosnode'))
        pub_topics = _succeed(scriptutil.get_master().getPublishedTopics('/rosnode', '/'))
    except socket.error:
        raise ROSNodeIOException("Unable to communicate with master!")

    # Grab the pub/sub/srv information from the nodes (along with type info),
    # put it in a nice structure, and print a JSON-formatted version.
    data = {}
    for n in nodes:
        pubs = [(t, topic_type(t, pub_topics)) for t, l in state[0] if n in l]
        subs = [(t, topic_type(t, pub_topics)) for t, l in state[1] if n in l]
        srvs = [(t, topic_type(t, pub_topics)) for t, l in state[2] if n in l]  
        
        data[n] = {'pubs':pubs, 'subs':subs, 'srvs':srvs}

    print(json.dumps(data))
