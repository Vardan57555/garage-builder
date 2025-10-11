#!/bin/sh
set -e

HOST=${MYSQL_DB_HOST:-localhost}
PORT=${MYSQL_DB_PORT:-3306}

echo "Waiting for MySQL at $HOST:$PORT..."

until nc -z $HOST $PORT; do
  echo "MySQL is not ready yet, retrying in 5 seconds..."
  sleep 5
done

echo "MySQL is ready!"
exec "$@"
