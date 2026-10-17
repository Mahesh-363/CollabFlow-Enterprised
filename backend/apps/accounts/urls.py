from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    TOTPSetupView,
    TOTPVerifyView,
    PresenceHeartbeatView,
    UserDirectoryView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='account-register'),
    path('login/', LoginView.as_view(), name='account-login'),
    path('logout/', LogoutView.as_view(), name='account-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/', MeView.as_view(), name='account-me'),
    path('change-password/', ChangePasswordView.as_view(), name='account-change-password'),
    path('2fa/setup/', TOTPSetupView.as_view(), name='account-2fa-setup'),
    path('2fa/verify/', TOTPVerifyView.as_view(), name='account-2fa-verify'),
    path('heartbeat/', PresenceHeartbeatView.as_view(), name='account-heartbeat'),
    path('directory/', UserDirectoryView.as_view(), name='account-directory'),
]
