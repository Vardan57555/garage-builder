if [[ -f "./pnpm-lock.yaml" ]];then
    (pnpm i && pnpm build && echo "================================================") || :
elif [[ -f "./package.json" ]];then
    (npm install && npm run build && echo "================================================") || :
fi

echo "Running migrations..."
npx sequelize-cli db:migrate --env development

echo "Running seeders..."
npx sequelize-cli db:seed:all --env development
