#!/bin/sh
set -e

HOST="localhost"
POSTGRES_PORT="5432"
REDIS_PORT="6379"

echo "Waiting for PostgreSQL and Redis to be available at $HOST:$POSTGRES_PORT..."

until nc -z $HOST $POSTGRES_PORT; do
  echo "PostgreSQL is not yet available, retrying in 5 seconds..."
  sleep 5
done

until nc -z $HOST $REDIS_PORT; do
  echo "Redis is not yet available, retrying in 5 seconds..."
  sleep 5
done

echo "PostgreSQL and Redis are available, proceeding..."
exec "$@"
