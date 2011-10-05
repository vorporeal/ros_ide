#!/usr/bin/env python

import os
import sys
import socket
import json
import xmlrpclib
import subprocess

from ros import rosnode
from ros import rosgraph
from rosgraph import masterapi

status = None
pub_topics = None
master = None

def _succeed(args):
    code, msg, val = args
    if code != 1:
        raise ROSNodeException("remote call failed: %s"%msg)
    return val

# Get the type of a given topic.
def topic_type(t):
        matches = [t_type for t_name, t_type in pub_topics if t_name == t]
        if matches:
            return matches[0]
        return None

def uri_to_exec_info(node):
    node_rpc = xmlrpclib.ServerProxy(master.lookupNode(node))
    pid = _succeed(node_rpc.getPid(''))

    command, err = subprocess.Popen(['ps', '-o', 'command=', str(pid)], stdout=subprocess.PIPE).communicate()
    command = command.split(' ')[0]

    path, exe = command.rsplit('/', 1)

    pkg_path = path
    while 'manifest.xml' not in os.listdir(pkg_path):
        pkg_path = pkg_path.rsplit('/', 1)[0]

    return {'pkg': pkg_path.rsplit('/', 1)[1], 'exec': exe}

def topic_data(t):
    ret = {}
    ret['name'] = t.rsplit('/', 1)[1]
    ret['id'] = t
    ret['type'] = topic_type(t)
    ret['connections'] = []

    return ret

if __name__ == '__main__':
    # Get the names of the running nodes.
    nodes = rosnode.get_node_names()

    # Get a reference to the ROS master.
    master = masterapi.Master('/ride_introspect')

    # Get the "node state" of the system.
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

        outputs = [topic_data(t) for t, l in state[0] + state[2] if n in l]
        inputs = [topic_data(t) for t, l in state[1] if n in l]
        
        data['nodes'].append({'name':name \
                             ,'id':n \
                             ,'outputs':outputs \
                             ,'inputs':inputs \
                             ,'x': 0 \
                             ,'y': 0 \
                             })
        data['nodes'][-1].update(uri_to_exec_info(n))

    print(json.dumps(data))
