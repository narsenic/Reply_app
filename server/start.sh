#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss || echo "DB push warning (non-fatal)"

echo "Seeding database..."
npx prisma db seed --schema=server/prisma/schema.prisma || echo "Seed warning (non-fatal)"

echo "Starting server..."
exec node server/dist/index.js
