#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files into STATIC_ROOT
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Optional: Run seed script if SEED_DB is set to true
if [ "$SEED_DB" = "true" ]; then
    echo "Seeding initial database data..."
    python seed_data.py
fi
