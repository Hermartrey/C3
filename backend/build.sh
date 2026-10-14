#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Collect static files into STATIC_ROOT
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

# Seed database if SEED_DB is true or if database is empty
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

