#!/bin/sh

. ~/bin/setup_node_env.sh

appname=${PWD##*/}

node index.js \
	--NODE_APP_INSTANCE="$appname";
