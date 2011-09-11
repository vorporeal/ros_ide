IN PROGRESS Python to Node.js port
==================================

To run the server:

	# compile the javascript for the webapp
	cd webapp && python build.py release

	# run the two servers (static files and dynamic socket.io)
	cd server && coffee server.coffee
	or
	cd server && node run.js

Dependencies:
	node.js
	npm
	socket.io
	coffee-script
	pyyaml
	paramiko (ssh module)
	json module (needs python2.6+)
