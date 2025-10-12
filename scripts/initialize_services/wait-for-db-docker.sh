#!/bin/sh
set -e

HOST=${MYSQL_HOST:-mysql}
PORT=${MYSQL_PORT:-3306}

echo "Waiting for MySQL to be available at $HOST:$PORT..."

until nc -z "$HOST" "$PORT"; do
  echo "MySQL is not yet available, retrying in 5 seconds..."
  sleep 5
done

echo "MySQL is available!"
exec "$@"
