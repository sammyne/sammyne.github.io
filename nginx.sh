#!/bin/bash

docker run --rm \
    -v ${PWD}/.vuepress/dist:/usr/share/nginx/html \
    --name html -p 9090:80 \
    nginx:1.17.3