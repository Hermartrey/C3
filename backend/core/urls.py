from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BranchViewSet, FuelTypeViewSet, InventoryViewSet,
    SaleViewSet, DeliveryViewSet, DashboardStatsView, UserProfileView,
    CreateManagerView, ExpenseViewSet, FinancialReportView,
    MessageViewSet, ManagerListView, NotificationViewSet,
    RequestPasswordCodeView, ChangePasswordView
)

router = DefaultRouter()
router.register(r'branches', BranchViewSet, basename='branch')
router.register(r'fuel-types', FuelTypeViewSet, basename='fueltype')
router.register(r'inventory', InventoryViewSet, basename='inventory')
router.register(r'sales', SaleViewSet, basename='sale')
router.register(r'deliveries', DeliveryViewSet, basename='delivery')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('managers/', CreateManagerView.as_view(), name='create-manager'),
    path('managers-list/', ManagerListView.as_view(), name='managers-list'),
    path('financial-report/', FinancialReportView.as_view(), name='financial-report'),
    path('settings/request-password-code/', RequestPasswordCodeView.as_view(), name='request-password-code'),
    path('settings/change-password/', ChangePasswordView.as_view(), name='change-password'),
]


