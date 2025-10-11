#!/bin/sh
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres -d reviro; do
  echo "PostgreSQL is not yet available, retrying in 5 seconds..."
  sleep 5
done
echo "PostgreSQL is ready!"
