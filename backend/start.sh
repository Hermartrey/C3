#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Running database migrations..."
python manage.py migrate --no-input

echo "==> Checking initial database seeding..."
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth.models import User
seed_env = os.getenv('SEED_DB', 'true').lower() in ('true', '1', 't')
no_users = User.objects.count() == 0
if seed_env or no_users:
    import seed_data
    print('Seeding database with default accounts and initial data...')
    seed_data.seed()
"

echo "==> Starting Gunicorn server..."
exec gunicorn config.wsgi:application
