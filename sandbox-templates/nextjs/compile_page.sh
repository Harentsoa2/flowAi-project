#!/bin/sh

# This script runs during building the sandbox template
# and makes sure the Next.js app is (1) running and (2) the `/` page is compiled
ping_server() {
	counter=0
	response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" || true)
	while [ "$response" != "200" ]; do
	  counter=$((counter + 1))
	  if [ $((counter % 20)) -eq 0 ]; then
        echo "Waiting for server to start..."
        sleep 0.1
      fi

	  response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" || true)
	done
}

ping_server &
cd /home/user && exec npx next dev --turbopack --hostname 0.0.0.0 --port 3000
