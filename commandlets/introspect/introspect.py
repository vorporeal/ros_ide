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

_ID = '/ride_introspect'

status = None
pub_topics = None
master = None

rpc_to_node = {}

# A simple function to make sure that no RPC issues get into the data.
def _succeed(args):
    code, msg, val = args
    if code != 1:
        raise rosnode.ROSNodeException("remote call failed: %s"%msg)
    return val

# Get the type of a given topic.
def topic_type(t):
        matches = [t_type for t_name, t_type in pub_topics if t_name == t]
        if matches:
            return matches[0]
        return None

# Determine the package and executable for a node based on its ROS URI.
def uri_to_exec_info(pid):
    command, err = subprocess.Popen(['ps', '-o', 'command=', str(pid)], stdout=subprocess.PIPE).communicate()
    
    command = command.split()
    cmd_index = 0
    if command[0].endswith('python'):
        cmd_index = 1
    command = command[cmd_index]

    path, exe = command.rsplit('/', 1)

    pkg_path = path
    while 'manifest.xml' not in os.listdir(pkg_path):
        pkg_path = pkg_path.rsplit('/', 1)[0]

    return {'pkg': pkg_path.rsplit('/', 1)[1], 'exec': exe}

# Generate the data structure representing a topic.
def topic_data(t, in_out, node_uri):
    ret = {}
    ret['name'] = t.rsplit('/', 1)[1]
    ret['id'] = '--topic--' + t + '_' + in_out[0]
    ret['type'] = topic_type(t)
    ret['connections'] = []

    bus_info = _succeed(xmlrpclib.ServerProxy(node_uri).getBusInfo(_ID))
    for conn in bus_info:
        if conn[4] == t:
            ret['connections'].append(t + '_' + in_out[1])

    return ret

if __name__ == '__main__':
    # Get the names of the running nodes.
    nodes = rosnode.get_node_names()

    # Get a reference to the ROS master.
    master = masterapi.Master(_ID)

    # Get the "node state" of the system.
    try:
        state = master.getSystemState()
        pub_topics = master.getPublishedTopics('')
    except socket.error:
        raise ROSNodeIOException("Unable to communicate with master!")

    # Create a mapping of RPC addresses to node URIs.
    for n in nodes:
        rpc_to_node[str(master.lookupNode(n))] = n;

    # Grab the pub/sub/srv information from the nodes (along with type info),
    # put it in a nice structure, and print a JSON-formatted version.
    data = {'nodes': []}
    for n in nodes:
        # Get an RPC proxy through which we can query the node.
        node_uri = master.lookupNode(n)
        node_rpc = xmlrpclib.ServerProxy(node_uri)
        # Wrap this in a try block in case we get strange issues with a node
        # not having a process ID.
        try:
            # Get the process ID of the node.
            pid = _succeed(node_rpc.getPid(_ID))
            # Get the package and executable information of the node.
            toadd = uri_to_exec_info(pid)

            name = n.rsplit('/', 1)[1]

            # Generate the per-topic structures for the node.
            # NOTE: Outputs no longer includes services, as they really should
            #       be treated separately from published topics.
            outputs = [topic_data(t, ('out', 'in'), node_uri) for t, l in state[0] if n in l]
            inputs = [topic_data(t, ('in', 'out'), node_uri) for t, l in state[1] if n in l]

            # Add all of this info to the node's data structure.
            toadd.update({'name':name \
                         ,'id':'--node--' + n \
                         ,'outputs':outputs \
                         ,'inputs':inputs \
                         ,'x': 0 \
                         ,'y': 0 \
                         })

            # Add the generated info the the output structure.
            data['nodes'].append(toadd)
        except:
            continue

    print(json.dumps(data))
