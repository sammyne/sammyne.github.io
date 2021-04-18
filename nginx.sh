#!/bin/bash

echo "pre-deploy @localhost:9090"

webappDir=$PWD/_post

docker run --rm \
    -v ${webappDir}/.vuepress/dist:/usr/share/nginx/html \
    --name html -p 9090:80 \
    nginx:1.19.6-alpine