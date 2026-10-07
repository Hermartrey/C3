from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

class Branch(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('MANAGER', 'Branch Manager'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MANAGER')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='managers')

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class FuelType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Inventory(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory')
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE)
    current_stock = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    capacity = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('branch', 'fuel_type')
        verbose_name_plural = "Inventories"

    def __str__(self):
        return f"{self.branch.name} - {self.fuel_type.name}: {self.current_stock}"

class Sale(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='sales')
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    recorder = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        if not self.total_amount:
            self.total_amount = Decimal(str(self.quantity)) * Decimal(str(self.unit_price))
        
        # Check Inventory
        inventory, created = Inventory.objects.get_or_create(
            branch=self.branch, fuel_type=self.fuel_type,
            defaults={'current_stock': Decimal('0.00'), 'capacity': Decimal('0.00')}
        )
        current_stock = Decimal(str(inventory.current_stock)) if not isinstance(inventory.current_stock, Decimal) else inventory.current_stock
        requested_qty = Decimal(str(self.quantity)) if not isinstance(self.quantity, Decimal) else self.quantity

        if requested_qty > current_stock:
            from django.core.exceptions import ValidationError
            raise ValidationError(
                f"Insufficient stock. Only {current_stock}L of "
                f"{self.fuel_type.name} available at {self.branch.name}, "
                f"but {requested_qty}L was requested."
            )
        
        # Deduct from Inventory
        inventory.current_stock = current_stock - requested_qty
        inventory.save()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sale: {self.fuel_type.name} at {self.branch.name} - {self.quantity}L"

class Delivery(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='deliveries')
    fuel_type = models.ForeignKey(FuelType, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    recorder = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        # Update Inventory
        inventory, created = Inventory.objects.get_or_create(
            branch=self.branch, fuel_type=self.fuel_type,
            defaults={'current_stock': Decimal('0.00'), 'capacity': Decimal('0.00')}
        )
        current_stock = Decimal(str(inventory.current_stock)) if not isinstance(inventory.current_stock, Decimal) else inventory.current_stock
        added_qty = Decimal(str(self.quantity)) if not isinstance(self.quantity, Decimal) else self.quantity

        inventory.current_stock = current_stock + added_qty
        inventory.save()
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Delivery: {self.fuel_type.name} to {self.branch.name} - {self.quantity}L"


class Expense(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    recorder = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.branch.name} - {self.description}: {self.amount}"


class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('INVENTORY_UPDATE', 'Inventory Update'),
        ('LOW_STOCK', 'Low Stock Alert'),
        ('DELIVERY', 'New Delivery'),
        ('GENERAL', 'General System Notification'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, default='GENERAL')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    link = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class PasswordResetCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='password_reset_code')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        now = timezone.now()
        return (now - self.created_at).total_seconds() < 600

    def __str__(self):
        return f"Code for {self.user.username}: {self.code}"



