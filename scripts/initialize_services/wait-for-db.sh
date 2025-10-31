#!/bin/sh
set -e

HOST=${MYSQL_DB_HOST:-localhost}
PORT=${MYSQL_DB_PORT:-3306}
REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}

echo "Waiting for MySQL at $HOST:$PORT..."

until nc -z $HOST $PORT; do
  echo "MySQL is not ready yet, retrying in 5 seconds..."
  sleep 5
done

echo "MySQL is ready!"

echo "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."

until nc -z $REDIS_HOST $REDIS_PORT; do
  echo "Redis is not yet available, retrying in 5 seconds..."
  sleep 5
done

echo "Redis is ready!"
exec "$@"
