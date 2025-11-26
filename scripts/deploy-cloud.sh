#!/bin/bash

cd /home/Turw-docs/

git pull --rebase

pnpm i

pnpm run build

/www/server/nginx/sbin/nginx -s reload
