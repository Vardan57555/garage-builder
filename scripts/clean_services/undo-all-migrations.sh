#!/bin/bash

echo "================================================ Cleaning all migrations... ================================================"

npx sequelize-cli db:migrate:undo:all

echo "================================================ All migrations undone successfully! ================================================"
