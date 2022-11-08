#!/bin/bash

#args="http://localhost:8000/dassets/searchall"

while true

do
  DOCKER_ID=`sudo docker ps | grep reverse-proxy-rust | grep target | awk '{print $1;}'`
  
  CODE=$(curl -s -o /dev/null -w "%{http_code}" 'http://localhost:8000/assets/searchall')
  if [[ $CODE -ne 200 ]]; then
    echo "Restarting docker for reverse-proxy-rust!"
    docker restart "$DOCKER_ID" 
  fi
  echo "Sleeping..."
  sleep 100
done

