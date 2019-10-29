#!/bin/bash

echo "pre-deploy @localhost:9090"

docker run --rm \
    -v ${PWD}/.vuepress/dist:/usr/share/nginx/html \
    --name html -p 9090:80 \
    nginx:1.17.3