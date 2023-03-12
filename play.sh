#!/bin/bash

repo_tag=node:18.15.0-alpine3.17

docker run -it --rm -v $PWD:/workspace -w /workspace $repo_tag sh
