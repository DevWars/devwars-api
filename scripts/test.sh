docker run --rm -v "$(pwd):/app" node:9 /bin/bash -c "cd /app; yarn install; yarn test;"
