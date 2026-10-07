import random
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, views, serializers as drf_serializers
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Sum, F, ExpressionWrapper, DecimalField, Q
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Branch, UserProfile, FuelType, Inventory, Sale, Delivery, Expense, Message, Notification, PasswordResetCode
from .serializers import (
    BranchSerializer, FuelTypeSerializer, InventorySerializer,
    SaleSerializer, DeliverySerializer, UserSerializer, ExpenseSerializer,
    MessageSerializer, NotificationSerializer
)

def create_notification(user, title, message, notification_type='GENERAL', link='/inventory'):
    if not user:
        return
    Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link
    )


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   hasattr(request.user, 'profile') and request.user.profile.role == 'ADMIN')

class IsManagerUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 
                   hasattr(request.user, 'profile') and request.user.profile.role == 'MANAGER')

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

class FuelTypeViewSet(viewsets.ModelViewSet):
    queryset = FuelType.objects.all()
    serializer_class = FuelTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            qs = Inventory.objects.all()
            branch_id = self.request.query_params.get('branch')
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            return qs
        return Inventory.objects.filter(branch=user.profile.branch)

    def perform_create(self, serializer):
        inventory = serializer.save()
        self._notify_inventory_change(inventory, created=True)

    def perform_update(self, serializer):
        inventory = serializer.save()
        self._notify_inventory_change(inventory, created=False)

    def _notify_inventory_change(self, inventory, created=False):
        # Notify branch manager(s) when owner updates stock
        managers = UserProfile.objects.filter(branch=inventory.branch, role='MANAGER').select_related('user')
        action_desc = "initialized stock level for" if created else "updated stock level for"
        msg = f"Owner {action_desc} {inventory.fuel_type.name} at {inventory.branch.name} to {inventory.current_stock} L (Capacity: {inventory.capacity} L)."
        for mgr in managers:
            create_notification(
                user=mgr.user,
                title=f"Inventory Updated: {inventory.fuel_type.name}",
                message=msg,
                notification_type='INVENTORY_UPDATE',
                link='/inventory'
            )

        # Check low stock threshold (< 20%)
        if inventory.capacity > 0 and (inventory.current_stock / inventory.capacity) < 0.20:
            percent = (inventory.current_stock / inventory.capacity) * 100
            low_msg = f"Low Stock Alert: {inventory.fuel_type.name} at {inventory.branch.name} is down to {inventory.current_stock} L ({percent:.0f}% capacity)."
            recipients = User.objects.filter(
                Q(profile__role='ADMIN') | Q(profile__branch=inventory.branch, profile__role='MANAGER')
            ).distinct()
            for rec in recipients:
                create_notification(
                    user=rec,
                    title=f"Low Stock Alert - {inventory.branch.name}",
                    message=low_msg,
                    notification_type='LOW_STOCK',
                    link='/inventory'
                )


class SaleViewSet(viewsets.ModelViewSet):
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            qs = Sale.objects.all().order_by('-timestamp')
            branch_id = self.request.query_params.get('branch')
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            return qs
        return Sale.objects.filter(branch=user.profile.branch).order_by('-timestamp')

    def perform_create(self, serializer):
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            serializer.save(recorder=self.request.user)
        except DjangoValidationError as e:
            raise drf_serializers.ValidationError({'error': e.message})

    @action(detail=False, methods=['post'], url_path='bulk-create')
    def bulk_create(self, request):
        from django.db import transaction
        from django.core.exceptions import ValidationError as DjangoValidationError
        from django.utils.dateparse import parse_datetime
        from decimal import Decimal
        
        user = request.user
        branch_id = request.data.get('branch')
        timestamp_str = request.data.get('timestamp')
        sales_data = request.data.get('sales', [])
        
        # Verify branch permission
        if user.profile.role != 'ADMIN':
            branch_id = user.profile.branch_id
            
        if not branch_id:
            return Response({'error': 'Branch is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not timestamp_str:
            return Response({'error': 'Timestamp is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        timestamp = parse_datetime(timestamp_str)
        if not timestamp:
            return Response({'error': 'Invalid timestamp format.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not sales_data:
            return Response({'error': 'At least one sale must be provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Filter and validate entries
        valid_sales = []
        for s in sales_data:
            fuel_type_id = s.get('fuel_type')
            qty = s.get('quantity')
            price = s.get('unit_price')
            
            # Skip completely empty entries
            if (qty is None or qty == '') and (price is None or price == ''):
                continue
            
            # If they entered one, they must enter both
            if qty is None or price is None or qty == '' or price == '':
                return Response(
                    {'error': 'Both quantity and unit price must be provided for recorded fuels.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            try:
                decimal_qty = Decimal(str(qty))
                decimal_price = Decimal(str(price))
            except Exception:
                return Response(
                    {'error': 'Quantity and Unit Price must be valid numbers.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            if decimal_qty <= 0:
                continue
                
            if decimal_price <= 0:
                return Response(
                    {'error': 'Unit price must be greater than zero.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            valid_sales.append({
                'fuel_type_id': fuel_type_id,
                'quantity': decimal_qty,
                'unit_price': decimal_price
            })
            
        if not valid_sales:
            return Response({'error': 'No valid sale quantities were entered.'}, status=status.HTTP_400_BAD_REQUEST)
            
        recorded_sales_count = 0
        try:
            with transaction.atomic():
                for s in valid_sales:
                    try:
                        fuel_type = FuelType.objects.get(id=s['fuel_type_id'])
                    except FuelType.DoesNotExist:
                        raise DjangoValidationError(f'Fuel Type with ID {s["fuel_type_id"]} does not exist.')
                        
                    # Create Sale (triggers inventory check and update on save)
                    sale = Sale(
                        branch=branch,
                        fuel_type=fuel_type,
                        quantity=s['quantity'],
                        unit_price=s['unit_price'],
                        timestamp=timestamp,
                        recorder=user
                    )
                    sale.save()
                    recorded_sales_count += 1
        except DjangoValidationError as e:
            return Response({'error': e.message}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            'status': 'success',
            'count': recorded_sales_count,
            'message': f'Successfully recorded {recorded_sales_count} sales.'
        }, status=status.HTTP_201_CREATED)

class DeliveryViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            qs = Delivery.objects.all().order_by('-timestamp')
            branch_id = self.request.query_params.get('branch')
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            return qs
        return Delivery.objects.filter(branch=user.profile.branch).order_by('-timestamp')

    def perform_create(self, serializer):
        delivery = serializer.save(recorder=self.request.user)
        # Notify Admins when delivery is recorded
        admins = User.objects.filter(profile__role='ADMIN')
        msg = f"{self.request.user.username} recorded a tank refill of {delivery.quantity} L ({delivery.fuel_type.name}) at {delivery.branch.name}."
        for admin in admins:
            create_notification(
                user=admin,
                title="New Refill Delivery Recorded",
                message=msg,
                notification_type='DELIVERY',
                link='/inventory'
            )


class DashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        
        # Determine scope
        if profile.role == 'ADMIN':
            branches = Branch.objects.all()
            sales = Sale.objects.all()
            deliveries = Delivery.objects.all()
            inventory = Inventory.objects.all()
        else:
            branches = Branch.objects.filter(id=profile.branch_id if profile.branch else None)
            sales = Sale.objects.filter(branch=profile.branch)
            deliveries = Delivery.objects.filter(branch=profile.branch)
            inventory = Inventory.objects.filter(branch=profile.branch)

        # Basic Stats
        total_sales_amount = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_liters_sold = sales.aggregate(total=Sum('quantity'))['total'] or 0
        total_deliveries_cost = deliveries.aggregate(
            total=Sum(F('quantity') * F('cost_price'), output_field=DecimalField())
        )['total'] or 0

        # Expenses
        if profile.role == 'ADMIN':
            expenses = Expense.objects.all()
        else:
            expenses = Expense.objects.filter(branch=profile.branch)
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0

        # Calculate net profit
        gross_profit = total_sales_amount - total_deliveries_cost
        profit = gross_profit - total_expenses

        # Inventory Summary
        inventory_summary = inventory.values('fuel_type__name').annotate(total_stock=Sum('current_stock'))

        # Recent Sales (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        daily_sales = sales.filter(timestamp__gte=seven_days_ago).values('timestamp__date').annotate(amount=Sum('total_amount')).order_by('timestamp__date')

        return Response({
            'total_sales': total_sales_amount,
            'total_liters': total_liters_sold,
            'total_expenses': total_expenses,
            'profit': profit,
            'inventory': list(inventory_summary),
            'daily_sales': list(daily_sales),
            'branch_count': branches.count() if profile.role == 'ADMIN' else 1
        })

class UserProfileView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CreateManagerView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        from django.contrib.auth.models import User as DjangoUser

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email    = request.data.get('email', '').strip()
        branch_id = request.data.get('branch')

        # Validate required fields
        if not username or not password or not branch_id:
            return Response(
                {'error': 'username, password, and branch are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if DjangoUser.objects.filter(username=username).exists():
            return Response(
                {'error': f"Username '{username}' is already taken."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            return Response({'error': 'Branch not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = DjangoUser.objects.create_user(username=username, password=password, email=email)
        UserProfile.objects.create(user=user, role='MANAGER', branch=branch)

        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'branch_id': branch.id,
            'branch_name': branch.name,
        }, status=status.HTTP_201_CREATED)



class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            qs = Expense.objects.all().order_by('-timestamp')
            branch_id = self.request.query_params.get('branch')
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            return qs
        return Expense.objects.filter(branch=user.profile.branch).order_by('-timestamp')

    def perform_create(self, serializer):
        user = self.request.user
        if user.profile.role == 'MANAGER':
            serializer.save(recorder=user, branch=user.profile.branch)
        else:
            serializer.save(recorder=user)


class FinancialReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        date_from_str = request.query_params.get('date_from')
        date_to_str   = request.query_params.get('date_to')
        branch_id     = request.query_params.get('branch')

        if profile.role == 'ADMIN':
            sales      = Sale.objects.all()
            deliveries = Delivery.objects.all()
            expenses   = Expense.objects.all()
            if branch_id:
                sales      = sales.filter(branch_id=branch_id)
                deliveries = deliveries.filter(branch_id=branch_id)
                expenses   = expenses.filter(branch_id=branch_id)
        else:
            sales      = Sale.objects.filter(branch=profile.branch)
            deliveries = Delivery.objects.filter(branch=profile.branch)
            expenses   = Expense.objects.filter(branch=profile.branch)

        if date_from_str:
            try:
                date_from = datetime.strptime(date_from_str, '%Y-%m-%d')
                sales      = sales.filter(timestamp__date__gte=date_from)
                deliveries = deliveries.filter(timestamp__date__gte=date_from)
                expenses   = expenses.filter(timestamp__date__gte=date_from)
            except ValueError:
                pass

        if date_to_str:
            try:
                date_to = datetime.strptime(date_to_str, '%Y-%m-%d')
                sales      = sales.filter(timestamp__date__lte=date_to)
                deliveries = deliveries.filter(timestamp__date__lte=date_to)
                expenses   = expenses.filter(timestamp__date__lte=date_to)
            except ValueError:
                pass

        total_revenue  = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        total_liters   = sales.aggregate(total=Sum('quantity'))['total'] or 0
        cogs = deliveries.aggregate(
            total=Sum(F('quantity') * F('cost_price'), output_field=DecimalField())
        )['total'] or 0
        gross_profit   = total_revenue - cogs
        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or 0
        net_profit     = gross_profit - total_expenses

        daily_revenue = (
            sales.values('timestamp__date')
            .annotate(revenue=Sum('total_amount'))
            .order_by('timestamp__date')
        )
        expense_breakdown = (
            expenses.values('description')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        monthly = (
            sales.values('timestamp__year', 'timestamp__month')
            .annotate(revenue=Sum('total_amount'), liters=Sum('quantity'))
            .order_by('timestamp__year', 'timestamp__month')
        )

        # Calculate Balance Sheet cumulative data as of bs_date
        bs_date = None
        if date_to_str:
            try:
                bs_date = datetime.strptime(date_to_str, '%Y-%m-%d').date()
            except ValueError:
                pass
        if not bs_date:
            bs_date = timezone.now().date()

        # Determine branch scope for Balance Sheet
        if profile.role == 'ADMIN':
            if branch_id:
                bs_branches = Branch.objects.filter(id=branch_id)
            else:
                bs_branches = Branch.objects.all()
        else:
            bs_branches = Branch.objects.filter(id=profile.branch_id if profile.branch else None)

        bs_sales = Sale.objects.filter(timestamp__date__lte=bs_date)
        bs_deliveries = Delivery.objects.filter(timestamp__date__lte=bs_date)
        bs_expenses = Expense.objects.filter(timestamp__date__lte=bs_date)

        if profile.role == 'ADMIN':
            if branch_id:
                bs_sales = bs_sales.filter(branch_id=branch_id)
                bs_deliveries = bs_deliveries.filter(branch_id=branch_id)
                bs_expenses = bs_expenses.filter(branch_id=branch_id)
        else:
            bs_sales = bs_sales.filter(branch=profile.branch)
            bs_deliveries = bs_deliveries.filter(branch=profile.branch)
            bs_expenses = bs_expenses.filter(branch=profile.branch)

        # Cash = cumulative revenue - cumulative deliveries - cumulative expenses
        bs_cum_sales = bs_sales.aggregate(total=Sum('total_amount'))['total'] or 0
        bs_cum_deliveries = bs_deliveries.aggregate(
            total=Sum(F('quantity') * F('cost_price'), output_field=DecimalField())
        )['total'] or 0
        bs_cum_expenses = bs_expenses.aggregate(total=Sum('amount'))['total'] or 0

        bs_cash = bs_cum_sales - bs_cum_deliveries - bs_cum_expenses

        # Inventory Value as of bs_date
        bs_inventory_value = 0
        fuel_types = FuelType.objects.all()
        for b in bs_branches:
            for ft in fuel_types:
                del_qs = Delivery.objects.filter(branch=b, fuel_type=ft, timestamp__date__lte=bs_date)
                total_del_qty = del_qs.aggregate(total=Sum('quantity'))['total'] or 0

                sale_qs = Sale.objects.filter(branch=b, fuel_type=ft, timestamp__date__lte=bs_date)
                total_sale_qty = sale_qs.aggregate(total=Sum('quantity'))['total'] or 0

                stock_at_t = max(0, total_del_qty - total_sale_qty)

                latest_del = del_qs.order_by('-timestamp').first()
                unit_cost = latest_del.cost_price if latest_del else 0

                bs_inventory_value += stock_at_t * unit_cost

        bs_total_assets = bs_cash + bs_inventory_value
        bs_liabilities = 0
        bs_equity = bs_total_assets - bs_liabilities

        return Response({
            'total_revenue':     total_revenue,
            'total_liters':      total_liters,
            'cogs':              cogs,
            'gross_profit':      gross_profit,
            'total_expenses':    total_expenses,
            'net_profit':        net_profit,
            'daily_revenue':     list(daily_revenue),
            'expense_breakdown': list(expense_breakdown),
            'monthly':           list(monthly),
            'balance_sheet': {
                'cash': bs_cash,
                'inventory_value': bs_inventory_value,
                'total_assets': bs_total_assets,
                'liabilities': bs_liabilities,
                'equity': bs_equity,
                'as_of_date': bs_date.strftime('%Y-%m-%d'),
            }
        })


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.all()

        branch_id = self.request.query_params.get('branch')
        recipient_id = self.request.query_params.get('recipient')

        if user.profile.role == 'ADMIN':
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            if recipient_id:
                qs = qs.filter(Q(recipient_id=recipient_id) | Q(sender_id=recipient_id))
            return qs.order_by('timestamp')
        else:
            # Manager role: see messages sent by them, sent directly to them, or sent to their branch
            manager_branch = user.profile.branch
            qs = qs.filter(
                Q(sender=user) | 
                Q(recipient=user) | 
                (Q(branch=manager_branch) if manager_branch else Q(pk=None))
            )
            return qs.order_by('timestamp')

    def perform_create(self, serializer):
        user = self.request.user
        branch_id = self.request.data.get('branch')
        branch = None
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                pass
        elif user.profile.role == 'MANAGER' and user.profile.branch:
            branch = user.profile.branch

        serializer.save(sender=user, branch=branch)

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        user = request.user
        branch_id = request.data.get('branch')
        
        qs = Message.objects.filter(is_read=False)
        if user.profile.role == 'ADMIN':
            if branch_id:
                qs = qs.filter(branch_id=branch_id, sender__profile__role='MANAGER')
            else:
                qs = qs.filter(sender__profile__role='MANAGER')
        else:
            qs = qs.filter(
                Q(recipient=user) | Q(branch=user.profile.branch),
                sender__profile__role='ADMIN'
            )
        
        updated_count = qs.update(is_read=True)
        return Response({'status': 'success', 'updated': updated_count})


class ManagerListView(views.APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        managers = UserProfile.objects.filter(role='MANAGER').select_related('user', 'branch')
        data = [
            {
                'id': p.user.id,
                'username': p.user.username,
                'email': p.user.email,
                'branch_id': p.branch.id if p.branch else None,
                'branch_name': p.branch.name if p.branch else 'Unassigned',
            }
            for p in managers
        ]
        return Response(data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'success', 'updated': updated})

    @action(detail=True, methods=['post', 'patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'success'})


class RequestPasswordCodeView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user
        if hasattr(user, 'profile') and user.profile.role != 'ADMIN':
            return Response(
                {'error': 'Branch managers are not allowed to change their password.'},
                status=status.HTTP_403_FORBIDDEN
            )

        email = request.data.get('email', '').strip() or user.email

        if email and email != user.email:
            user.email = email
            user.save()

        if not email:
            return Response(
                {'error': 'No email address on file. Please enter your email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        code = f"{random.randint(100000, 999999)}"
        
        reset_obj, created = PasswordResetCode.objects.get_or_create(user=user)
        reset_obj.code = code
        reset_obj.save()

        subject = "C3 Fuels - Password Change Verification Code"
        message = (
            f"Hello {user.username},\n\n"
            f"Your verification code to change your password is: {code}\n\n"
            f"This code will expire in 10 minutes.\n"
            f"If you did not request this, please secure your account.\n\n"
            f"Best regards,\nC3 Fuels Administration"
        )

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@c3fuels.com'),
                recipient_list=[email],
                fail_silently=True
            )
        except Exception as e:
            print(f"Failed to send email: {e}")

        create_notification(
            user=user,
            title="Password Reset Code",
            message=f"Verification code {code} sent to {email}.",
            notification_type="GENERAL",
            link="/settings"
        )

        return Response({
            'status': 'success',
            'message': f'Verification code sent to {email}.',
            'email': email,
            'code': code
        })


class ChangePasswordView(views.APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user
        if hasattr(user, 'profile') and user.profile.role != 'ADMIN':
            return Response(
                {'error': 'Branch managers are not allowed to change their password.'},
                status=status.HTTP_403_FORBIDDEN
            )

        code = request.data.get('code', '').strip()
        current_password = request.data.get('current_password', '')
        new_password = request.data.get('new_password', '')

        if not current_password or not new_password or not code:
            return Response(
                {'error': 'Current password, new password, and verification code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {'error': 'Incorrect current password.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'error': 'New password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reset_obj = PasswordResetCode.objects.get(user=user)
        except PasswordResetCode.DoesNotExist:
            return Response(
                {'error': 'No verification code requested. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reset_obj.code != code:
            return Response(
                {'error': 'Invalid verification code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not reset_obj.is_valid():
            return Response(
                {'error': 'Verification code has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        reset_obj.delete()

        create_notification(
            user=user,
            title="Password Changed",
            message="Your password was successfully updated.",
            notification_type="GENERAL",
            link="/settings"
        )

        return Response({'status': 'success', 'message': 'Password updated successfully.'})



