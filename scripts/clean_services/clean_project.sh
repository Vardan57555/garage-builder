#!/bin/bash

sh scripts/clean_services/undo-all-seeders.sh

sh scripts/clean_services/undo-all-migrations.sh

rm -rf node_modules/ build/
