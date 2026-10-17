import pyotp
import secrets
from rest_framework import generics, status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    TOTPVerifySerializer,
)
from .presence import PresenceEngine


class RegisterView(generics.CreateAPIView):
    """Register new account, generate JWT tokens and initial workspace."""
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Provision initial workspace for new user
        from apps.workspaces.models import Workspace, WorkspaceMembership
        ws_name = serializer.validated_data.get('workspace_name') or f"{user.name}'s Workspace"
        workspace = Workspace.objects.create(
            name=ws_name,
            owner=user,
            icon=ws_name[:2].upper(),
            color='#9333ea',
        )
        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=user,
            role='owner'
        )

        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Account created successfully',
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'user': UserSerializer(user).data,
            'workspace': {
                'id': workspace.id,
                'name': workspace.name,
                'slug': workspace.slug,
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(views.APIView):
    """Authenticate with email and password (plus optional TOTP 2FA)."""
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        PresenceEngine.record_heartbeat(user.id, socket_id="http_session")

        return Response({
            'success': True,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            'user': UserSerializer(user).data,
        })


class LogoutView(views.APIView):
    """Blacklist refresh token and set user presence offline."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        user = request.user
        user.presence = 'offline'
        user.save(update_fields=['presence'])
        PresenceEngine.disconnect_socket(user.id, socket_id="http_session")

        return Response({'success': True, 'message': 'Logged out successfully'})


class MeView(generics.RetrieveUpdateAPIView):
    """Retrieve or update current user profile (presence, status, avatar, title)."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        # Handle presence or customStatus update
        if 'presence' in request.data:
            user.presence = request.data['presence']
        if 'customStatus' in request.data:
            user.custom_status = request.data['customStatus']
        if 'name' in request.data:
            user.name = request.data['name']
        if 'title' in request.data:
            user.title = request.data['title']
        user.save()
        return Response({
            'success': True,
            'user': UserSerializer(user).data
        })


class ChangePasswordView(views.APIView):
    """Change authenticated user password."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'success': True, 'message': 'Password updated successfully.'})


class TOTPSetupView(views.APIView):
    """Generate TOTP secret and provisioning URI for Google Authenticator / 1Password."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        secret = pyotp.random_base32()
        user.totp_secret = secret
        user.save(update_fields=['totp_secret'])

        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name='CollabFlow Enterprise'
        )

        return Response({
            'success': True,
            'secret': secret,
            'provisioning_uri': provisioning_uri,
        })


class TOTPVerifyView(views.APIView):
    """Verify code and enable 2FA on account, generating backup recovery codes."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = TOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code']
        user = request.user

        if not user.totp_secret:
            return Response({'success': False, 'message': '2FA setup was not initiated.'}, status=400)

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(code, valid_window=1):
            return Response({'success': False, 'message': 'Invalid verification code.'}, status=400)

        recovery_codes = [secrets.token_hex(4).upper() for _ in range(8)]
        user.totp_enabled = True
        user.recovery_codes = recovery_codes
        user.save(update_fields=['totp_enabled', 'recovery_codes'])

        return Response({
            'success': True,
            'message': 'Two-factor authentication enabled successfully.',
            'recovery_codes': recovery_codes
        })


class PresenceHeartbeatView(views.APIView):
    """Record liveness heartbeat from active client."""
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        socket_id = request.data.get('socket_id', 'http_poll')
        PresenceEngine.record_heartbeat(
            request.user.id,
            socket_id=socket_id,
            client_ip=request.META.get('REMOTE_ADDR', '')
        )
        return Response({
            'success': True,
            'presence': PresenceEngine.get_user_presence(request.user.id),
            'presenceMap': PresenceEngine.get_presence_map()
        })


class UserDirectoryView(generics.ListAPIView):
    """Directory listing of all active workspace users."""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(is_active=True).order_by('name')
