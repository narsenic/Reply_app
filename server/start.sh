#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=server/prisma/schema.prisma || echo "Migration warning (non-fatal)"

echo "Starting server..."
exec node server/dist/index.js
