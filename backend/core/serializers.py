from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Branch, UserProfile, FuelType, Inventory, Sale, Delivery, Expense, Message, Notification

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    branch = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'branch', 'branch_name']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Exception:
            return 'ADMIN' if (obj.is_superuser or obj.is_staff) else 'MANAGER'

    def get_branch(self, obj):
        try:
            return obj.profile.branch_id if (hasattr(obj, 'profile') and obj.profile and obj.profile.branch) else None
        except Exception:
            return None

    def get_branch_name(self, obj):
        try:
            return obj.profile.branch.name if (hasattr(obj, 'profile') and obj.profile and obj.profile.branch) else None
        except Exception:
            return None

class BranchSerializer(serializers.ModelSerializer):
    managers_list = serializers.SerializerMethodField()

    def get_managers_list(self, obj):
        return [
            {'id': p.user.id, 'profile_id': p.id, 'username': p.user.username, 'email': p.user.email}
            for p in obj.managers.select_related('user').all()
        ]

    class Meta:
        model = Branch
        fields = '__all__'

class FuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelType
        fields = '__all__'

class InventorySerializer(serializers.ModelSerializer):
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Inventory
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    recorder_name = serializers.CharField(source='recorder.username', read_only=True)

    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ['total_amount', 'recorder']

class DeliverySerializer(serializers.ModelSerializer):
    fuel_type_name = serializers.CharField(source='fuel_type.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    recorder_name = serializers.CharField(source='recorder.username', read_only=True)

    class Meta:
        model = Delivery
        fields = '__all__'
        read_only_fields = ['recorder']


class ExpenseSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    recorder_name = serializers.CharField(source='recorder.username', read_only=True)

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['recorder', 'branch']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.profile.role', read_only=True, default='ADMIN')
    recipient_name = serializers.CharField(source='recipient.username', read_only=True, default='')
    branch_name = serializers.CharField(source='branch.name', read_only=True, default='')

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ['sender', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['created_at']


