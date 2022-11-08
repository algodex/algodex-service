#!/bin/bash

#args="http://localhost:8000/dassets/searchall"

while true

do
  code=$(curl -s -o /dev/null -w "%{http_code}" 'http://localhost:8000/assets/searchall')
  if [[ $code -ne 200 ]]; then
    echo "Restarting docker for reverse-proxy-rust!"
    docker restart 60a94f5d4ddf 
  fi
  echo "Sleeping..."
  sleep 100 
done

