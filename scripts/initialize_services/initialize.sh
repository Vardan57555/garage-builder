#!/bin/sh
set -e

# Install dependencies
if [[ -f "./pnpm-lock.yaml" ]]; then
    pnpm install && pnpm build
elif [[ -f "./package.json" ]]; then
    npm install && npm run build
else
    echo "⚠️ No package manager file found — skipping install/build"
fi


echo "================================================"
echo "🧠 Initializing Ollama service..."
sh ./scripts/initialize_services/ollama-init.sh &
sh ./scripts/initialize_services/ollama-wait.sh
sh ./scripts/initialize_services/ollama-model-wait.sh
echo "================================================"
echo "✅ Initialization completed successfully!"

#echo "================================================"
#echo "🧱 Running Sequelize migrations..."
#npx sequelize-cli db:migrate --env development

# Optional: run seeders
# echo "🌱 Running Sequelize seeders..."
# npx sequelize-cli db:seed:all --env development

