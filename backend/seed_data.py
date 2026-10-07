import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from core.models import FuelType, UserProfile, Branch, Inventory, Sale, Delivery
from django.utils import timezone
from datetime import timedelta
import random
from decimal import Decimal

def seed():
    # 1. Create Fuel Types
    fuel_types_data = [
        ('Diesel', 10000.0),
        ('Unleaded', 8000.0),
        ('Premium', 8000.0),
        ('V-Power Diesel', 5000.0),
        ('V-Power Racing', 5000.0)
    ]
    fuel_type_objects = []
    for ft_name, capacity in fuel_types_data:
        ft, created = FuelType.objects.get_or_create(name=ft_name)
        fuel_type_objects.append((ft, Decimal(str(capacity))))
        if created:
            print(f"Created fuel type: {ft_name}")

    # 2. Create Admin User
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'is_staff': True,
            'is_superuser': True,
            'email': 'admin@fuelflow.com'
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("Created admin user: admin / admin123")
    
    UserProfile.objects.get_or_create(user=admin_user, defaults={'role': 'ADMIN'})

    # 3. Create a default branch
    branch, created = Branch.objects.get_or_create(
        name='Main Station',
        defaults={'location': 'Metropolis', 'address': '123 Fuel St'}
    )
    if created:
        print(f"Created branch: {branch.name}")
    
    # 4. Initialize Inventory for the branch
    for ft, cap in fuel_type_objects:
        inv, created = Inventory.objects.get_or_create(
            branch=branch, 
            fuel_type=ft,
            defaults={'current_stock': cap * Decimal('0.75'), 'capacity': cap}
        )
        if created:
            print(f"Initialized inventory for {ft.name} at {branch.name}")

    # 5. Create some sales for the last 5 days
    if Sale.objects.filter(branch=branch).count() == 0:
        for i in range(5):
            date = timezone.now() - timedelta(days=i)
            for _ in range(3):
                ft, _ = random.choice(fuel_type_objects)
                qty = Decimal(str(round(random.uniform(20, 100), 2)))
                price = Decimal(str(round(random.uniform(50, 70), 2)))
                Sale.objects.create(
                    branch=branch,
                    fuel_type=ft,
                    quantity=qty,
                    unit_price=price,
                    timestamp=date,
                    recorder=admin_user
                )
        print("Created sample sales data")

    # 6. Create manager user
    manager_user, created = User.objects.get_or_create(
        username='manager',
        defaults={'email': 'manager@fuelflow.com'}
    )
    if created:
        manager_user.set_password('manager123')
        manager_user.save()
        UserProfile.objects.get_or_create(user=manager_user, defaults={'role': 'MANAGER', 'branch': branch})
        print("Created manager user: manager / manager123")

if __name__ == '__main__':
    seed()

if __name__ == '__main__':
    seed()
