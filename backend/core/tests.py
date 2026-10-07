from decimal import Decimal
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase
from core.models import (
    Branch, UserProfile, FuelType, Inventory, Sale, Delivery,
    Expense, Message, Notification, PasswordResetCode
)

class AuthAndPermissionsIntegrationTestCase(APITestCase):
    def setUp(self):
        # Create Admin
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@c3fuels.com',
            password='Password123!'
        )
        UserProfile.objects.create(user=self.admin_user, role='ADMIN')

        # Create Branch
        self.branch1 = Branch.objects.create(name='Main Station', location='Downtown', address='123 Main St')

        # Create Manager
        self.manager_user = User.objects.create_user(
            username='manager_test',
            email='manager@c3fuels.com',
            password='Password123!'
        )
        self.manager_profile = UserProfile.objects.create(
            user=self.manager_user,
            role='MANAGER',
            branch=self.branch1
        )

    def test_jwt_login_and_user_profile(self):
        # JWT Token Login
        res = self.client.post('/api/token/', {
            'username': 'admin_test',
            'password': 'Password123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        admin_token = res.data['access']

        # Get User Profile as Admin
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        profile_res = self.client.get('/api/me/')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['username'], 'admin_test')
        self.assertEqual(profile_res.data['role'], 'ADMIN')

    def test_role_based_permissions(self):
        # Manager credentials
        mgr_token_res = self.client.post('/api/token/', {
            'username': 'manager_test',
            'password': 'Password123!'
        })
        mgr_token = mgr_token_res.data['access']

        # Manager trying to create branch -> Forbidden (403)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {mgr_token}')
        create_branch_res = self.client.post('/api/branches/', {
            'name': 'Unauthorized Branch',
            'location': 'Suburbs'
        })
        self.assertEqual(create_branch_res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin creating branch -> Created (201)
        admin_token_res = self.client.post('/api/token/', {
            'username': 'admin_test',
            'password': 'Password123!'
        })
        admin_token = admin_token_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')
        admin_branch_res = self.client.post('/api/branches/', {
            'name': 'North Branch',
            'location': 'Northside'
        })
        self.assertEqual(admin_branch_res.status_code, status.HTTP_201_CREATED)

    def test_create_and_list_managers(self):
        # Admin credentials
        admin_token_res = self.client.post('/api/token/', {
            'username': 'admin_test',
            'password': 'Password123!'
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token_res.data["access"]}')

        # Create Manager Endpoint
        create_res = self.client.post('/api/managers/', {
            'username': 'new_mgr',
            'password': 'Password123!',
            'email': 'newmgr@c3fuels.com',
            'branch': self.branch1.id
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data['username'], 'new_mgr')

        # List Managers Endpoint
        list_res = self.client.get('/api/managers-list/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        usernames = [m['username'] for m in list_res.data]
        self.assertIn('manager_test', usernames)
        self.assertIn('new_mgr', usernames)


class InventoryAndDeliveryIntegrationTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin_inv', 'admin@c3.com', 'Pass123!')
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        self.branch = Branch.objects.create(name='Central Branch', location='City Center')
        self.manager = User.objects.create_user('mgr_inv', 'mgr@c3.com', 'Pass123!')
        UserProfile.objects.create(user=self.manager, role='MANAGER', branch=self.branch)

        self.fuel_diesel = FuelType.objects.create(name='Diesel Premium', description='Clean Diesel')

        # Authenticate as Admin
        res = self.client.post('/api/token/', {'username': 'admin_inv', 'password': 'Pass123!'})
        self.admin_token = res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

    def test_delivery_refill_updates_inventory_and_notifies(self):
        # Record a delivery of 5000L Diesel @ 45.00 cost price
        del_res = self.client.post('/api/deliveries/', {
            'branch': self.branch.id,
            'fuel_type': self.fuel_diesel.id,
            'quantity': '5000.00',
            'cost_price': '45.00'
        })
        self.assertEqual(del_res.status_code, status.HTTP_201_CREATED)

        # Check Inventory stock automatically created/updated
        inv = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_diesel)
        self.assertEqual(inv.current_stock, Decimal('5000.00'))

        # Check notification sent to Admin
        admin_notifications = Notification.objects.filter(user=self.admin, notification_type='DELIVERY')
        self.assertTrue(admin_notifications.exists())
        self.assertIn('5000', admin_notifications.first().message)

    def test_inventory_update_and_low_stock_threshold_alerts(self):
        # Initialize Inventory with 10,000L capacity and 5,000L stock
        inv_res = self.client.post('/api/inventory/', {
            'branch': self.branch.id,
            'fuel_type': self.fuel_diesel.id,
            'current_stock': '5000.00',
            'capacity': '10000.00'
        })
        self.assertEqual(inv_res.status_code, status.HTTP_201_CREATED)
        inv_id = inv_res.data['id']

        # Check manager received INVENTORY_UPDATE notification
        mgr_notifs = Notification.objects.filter(user=self.manager, notification_type='INVENTORY_UPDATE')
        self.assertTrue(mgr_notifs.exists())

        # Update inventory to 1,500L (15% capacity -> low stock threshold <20%)
        patch_res = self.client.patch(f'/api/inventory/{inv_id}/', {
            'current_stock': '1500.00'
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        # Verify Low Stock Alert notifications sent to Manager & Admin
        low_stock_notifs = Notification.objects.filter(notification_type='LOW_STOCK')
        self.assertGreaterEqual(low_stock_notifs.count(), 2)


class SalesAndStockDeductionIntegrationTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin_sale', 'admin@c3.com', 'Pass123!')
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        self.branch = Branch.objects.create(name='Highway Station', location='Route 66')
        self.fuel_unleaded = FuelType.objects.create(name='Unleaded 95')
        self.fuel_diesel = FuelType.objects.create(name='Diesel Standard')

        # Stock 1,000L Unleaded & 2,000L Diesel
        Inventory.objects.create(branch=self.branch, fuel_type=self.fuel_unleaded, current_stock=Decimal('1000.00'), capacity=Decimal('5000.00'))
        Inventory.objects.create(branch=self.branch, fuel_type=self.fuel_diesel, current_stock=Decimal('2000.00'), capacity=Decimal('5000.00'))

        # Login
        res = self.client.post('/api/token/', {'username': 'admin_sale', 'password': 'Pass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {res.data["access"]}')

    def test_single_sale_deducts_inventory(self):
        sale_res = self.client.post('/api/sales/', {
            'branch': self.branch.id,
            'fuel_type': self.fuel_unleaded.id,
            'quantity': '200.00',
            'unit_price': '60.00'
        })
        self.assertEqual(sale_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(sale_res.data['total_amount'])), Decimal('12000.00'))

        inv = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_unleaded)
        self.assertEqual(inv.current_stock, Decimal('800.00'))

    def test_sale_exceeding_stock_fails_gracefully(self):
        sale_res = self.client.post('/api/sales/', {
            'branch': self.branch.id,
            'fuel_type': self.fuel_unleaded.id,
            'quantity': '1500.00', # Stock is only 1000L
            'unit_price': '60.00'
        })
        self.assertEqual(sale_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', sale_res.data)

        # Inventory unchanged
        inv = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_unleaded)
        self.assertEqual(inv.current_stock, Decimal('1000.00'))

    def test_bulk_create_sales_success_and_atomic_rollback(self):
        # 1. Valid bulk create
        now_iso = timezone.now().isoformat()
        bulk_res = self.client.post('/api/sales/bulk-create/', {
            'branch': self.branch.id,
            'timestamp': now_iso,
            'sales': [
                {'fuel_type': self.fuel_unleaded.id, 'quantity': '100.00', 'unit_price': '60.00'},
                {'fuel_type': self.fuel_diesel.id, 'quantity': '300.00', 'unit_price': '55.00'},
            ]
        }, format='json')
        self.assertEqual(bulk_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(bulk_res.data['count'], 2)

        inv_u = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_unleaded)
        inv_d = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_diesel)
        self.assertEqual(inv_u.current_stock, Decimal('900.00'))
        self.assertEqual(inv_d.current_stock, Decimal('1700.00'))

        # 2. Atomic rollback when second item exceeds available stock
        fail_bulk_res = self.client.post('/api/sales/bulk-create/', {
            'branch': self.branch.id,
            'timestamp': now_iso,
            'sales': [
                {'fuel_type': self.fuel_unleaded.id, 'quantity': '100.00', 'unit_price': '60.00'},
                {'fuel_type': self.fuel_diesel.id, 'quantity': '9999.00', 'unit_price': '55.00'}, # Exceeds 1700L
            ]
        }, format='json')
        self.assertEqual(fail_bulk_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Ensure first item was also rolled back
        inv_u_after = Inventory.objects.get(branch=self.branch, fuel_type=self.fuel_unleaded)
        self.assertEqual(inv_u_after.current_stock, Decimal('900.00'))


class FinancialReportsAndDashboardIntegrationTestCase(APITestCase):
    def setUp(self):
        # Setup Admin & Manager
        self.admin = User.objects.create_superuser('admin_fin', 'admin@fin.com', 'Pass123!')
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        self.branch1 = Branch.objects.create(name='Branch A', location='Location A')
        self.branch2 = Branch.objects.create(name='Branch B', location='Location B')

        self.manager1 = User.objects.create_user('mgr_a', 'mgra@fin.com', 'Pass123!')
        UserProfile.objects.create(user=self.manager1, role='MANAGER', branch=self.branch1)

        self.fuel = FuelType.objects.create(name='V-Power')

        # Add Deliveries:
        # Branch A: 1000L @ 40.00 = 40,000 cost
        Delivery.objects.create(branch=self.branch1, fuel_type=self.fuel, quantity=Decimal('1000.00'), cost_price=Decimal('40.00'))

        # Add Sales:
        # Branch A: 500L @ 50.00 = 25,000 revenue
        Sale.objects.create(branch=self.branch1, fuel_type=self.fuel, quantity=Decimal('500.00'), unit_price=Decimal('50.00'), total_amount=Decimal('25000.00'))

        # Add Expenses:
        # Branch A: 5,000 operational expenses
        Expense.objects.create(branch=self.branch1, description='Electricity', amount=Decimal('5000.00'))

        # Deliveries/Sales/Expenses for Branch B:
        Delivery.objects.create(branch=self.branch2, fuel_type=self.fuel, quantity=Decimal('2000.00'), cost_price=Decimal('40.00'))
        Sale.objects.create(branch=self.branch2, fuel_type=self.fuel, quantity=Decimal('1000.00'), unit_price=Decimal('50.00'), total_amount=Decimal('50000.00'))
        Expense.objects.create(branch=self.branch2, description='Maintenance', amount=Decimal('10000.00'))

    def test_dashboard_stats_admin_vs_manager_scope(self):
        # Admin query (sees all branches)
        admin_res = self.client.post('/api/token/', {'username': 'admin_fin', 'password': 'Pass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_res.data["access"]}')

        dash_admin = self.client.get('/api/dashboard-stats/')
        self.assertEqual(dash_admin.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(dash_admin.data['total_sales'])), Decimal('75000.00'))
        self.assertEqual(Decimal(str(dash_admin.data['total_liters'])), Decimal('1500.00'))
        self.assertEqual(Decimal(str(dash_admin.data['total_expenses'])), Decimal('15000.00'))
        self.assertEqual(dash_admin.data['branch_count'], 2)

        # Manager query (sees only Branch A)
        mgr_res = self.client.post('/api/token/', {'username': 'mgr_a', 'password': 'Pass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {mgr_res.data["access"]}')

        dash_mgr = self.client.get('/api/dashboard-stats/')
        self.assertEqual(dash_mgr.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(str(dash_mgr.data['total_sales'])), Decimal('25000.00'))
        self.assertEqual(Decimal(str(dash_mgr.data['total_liters'])), Decimal('500.00'))
        self.assertEqual(Decimal(str(dash_mgr.data['total_expenses'])), Decimal('5000.00'))

    def test_financial_report_and_balance_sheet(self):
        admin_res = self.client.post('/api/token/', {'username': 'admin_fin', 'password': 'Pass123!'})
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_res.data["access"]}')

        # Query financial report filtered to Branch A
        report_res = self.client.get(f'/api/financial-report/?branch={self.branch1.id}')
        self.assertEqual(report_res.status_code, status.HTTP_200_OK)

        data = report_res.data
        self.assertEqual(Decimal(str(data['total_revenue'])), Decimal('25000.00'))
        self.assertEqual(Decimal(str(data['cogs'])), Decimal('40000.00'))
        self.assertEqual(Decimal(str(data['gross_profit'])), Decimal('-15000.00'))
        self.assertEqual(Decimal(str(data['total_expenses'])), Decimal('5000.00'))
        self.assertEqual(Decimal(str(data['net_profit'])), Decimal('-20000.00'))

        # Balance sheet check:
        # Branch A cum_sales = 25000, cum_deliveries = 40000, cum_expenses = 5000 => cash = -20000
        # Remaining stock = 1000 - 500 = 500L @ 40 cost = 20000 inventory_value
        # Total Assets = cash (-20000) + inventory (20000) = 0
        bs = data['balance_sheet']
        self.assertEqual(Decimal(str(bs['cash'])), Decimal('-20000.00'))
        self.assertEqual(Decimal(str(bs['inventory_value'])), Decimal('20000.00'))
        self.assertEqual(Decimal(str(bs['total_assets'])), Decimal('0.00'))
        self.assertEqual(Decimal(str(bs['equity'])), Decimal('0.00'))


class MessagingAndNotificationsIntegrationTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin_msg', 'admin@msg.com', 'Pass123!')
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        self.branch = Branch.objects.create(name='Eastside Branch', location='East')
        self.manager = User.objects.create_user('mgr_msg', 'mgr@msg.com', 'Pass123!')
        UserProfile.objects.create(user=self.manager, role='MANAGER', branch=self.branch)

        # Login Manager
        res = self.client.post('/api/token/', {'username': 'mgr_msg', 'password': 'Pass123!'})
        self.mgr_token = res.data['access']

        # Login Admin
        res_admin = self.client.post('/api/token/', {'username': 'admin_msg', 'password': 'Pass123!'})
        self.admin_token = res_admin.data['access']

    def test_messaging_flow_and_mark_read(self):
        # Manager sends message to Admin
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.mgr_token}')
        msg_res = self.client.post('/api/messages/', {
            'recipient': self.admin.id,
            'content': 'Need approval for fuel delivery.'
        })
        self.assertEqual(msg_res.status_code, status.HTTP_201_CREATED)
        message_id = msg_res.data['id']

        # Admin fetches messages
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')
        list_res = self.client.get('/api/messages/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 1)
        self.assertFalse(list_res.data[0]['is_read'])

        # Admin marks read
        mark_res = self.client.post('/api/messages/mark-read/', {'branch': self.branch.id})
        self.assertEqual(mark_res.status_code, status.HTTP_200_OK)
        self.assertEqual(mark_res.data['updated'], 1)

        msg = Message.objects.get(id=message_id)
        self.assertTrue(msg.is_read)

    def test_notifications_mark_read_and_mark_all_read(self):
        n1 = Notification.objects.create(user=self.admin, title='N1', message='Message 1')
        n2 = Notification.objects.create(user=self.admin, title='N2', message='Message 2')

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # Mark single notification read
        mark_single = self.client.post(f'/api/notifications/{n1.id}/mark-read/')
        self.assertEqual(mark_single.status_code, status.HTTP_200_OK)
        n1.refresh_from_db()
        self.assertTrue(n1.is_read)

        # Mark all read
        mark_all = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(mark_all.status_code, status.HTTP_200_OK)
        n2.refresh_from_db()
        self.assertTrue(n2.is_read)


class PasswordResetFlowIntegrationTestCase(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin_pwd', 'admin@pwd.com', 'Pass123!')
        UserProfile.objects.create(user=self.admin, role='ADMIN')

        self.manager = User.objects.create_user('mgr_pwd', 'mgr@pwd.com', 'Pass123!')
        UserProfile.objects.create(user=self.manager, role='MANAGER')

        # Login Admin
        res_admin = self.client.post('/api/token/', {'username': 'admin_pwd', 'password': 'Pass123!'})
        self.admin_token = res_admin.data['access']

        # Login Manager
        res_mgr = self.client.post('/api/token/', {'username': 'mgr_pwd', 'password': 'Pass123!'})
        self.mgr_token = res_mgr.data['access']

    def test_manager_forbidden_password_change(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.mgr_token}')
        req_res = self.client.post('/api/settings/request-password-code/')
        self.assertEqual(req_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_full_password_reset_flow(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.admin_token}')

        # 1. Request Code
        req_res = self.client.post('/api/settings/request-password-code/', {'email': 'admin@pwd.com'})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        code = req_res.data['code']
        self.assertEqual(len(code), 6)

        # 2. Attempt change with incorrect current password -> 400
        change_fail_1 = self.client.post('/api/settings/change-password/', {
            'code': code,
            'current_password': 'WrongPassword!',
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(change_fail_1.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Attempt change with invalid verification code -> 400
        change_fail_2 = self.client.post('/api/settings/change-password/', {
            'code': '000000',
            'current_password': 'Pass123!',
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(change_fail_2.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Successful password change
        change_success = self.client.post('/api/settings/change-password/', {
            'code': code,
            'current_password': 'Pass123!',
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(change_success.status_code, status.HTTP_200_OK)

        # 5. Verify login with new password
        login_res = self.client.post('/api/token/', {
            'username': 'admin_pwd',
            'password': 'NewPassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
