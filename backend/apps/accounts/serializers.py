import pyotp
import secrets
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializes User model exactly matching TypeScript `User`:
    { id, name, email, avatar, title, role, presence, customStatus, isBot }
    """
    customStatus = serializers.CharField(source='custom_status', required=False, allow_blank=True)
    isBot = serializers.BooleanField(source='is_bot', required=False)
    avatarUrl = serializers.URLField(source='avatar_url', required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id',
            'name',
            'email',
            'avatar',
            'avatarUrl',
            'title',
            'role',
            'presence',
            'customStatus',
            'isBot',
            'totp_enabled',
        )
        read_only_fields = ('id', 'role', 'isBot', 'totp_enabled')


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    workspace_name = serializers.CharField(max_length=150, required=False, default="My Workspace")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        name = validated_data['name']
        email = validated_data['email']
        password = validated_data['password']

        # Generate avatar initials
        initials = ''.join([part[0].upper() for part in name.strip().split() if part])[:2] or 'U'

        user = User.objects.create_user(
            email=email,
            password=password,
            name=name,
            avatar=initials,
            title='Staff Member',
            role='member',
            presence='online',
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    totp_code = serializers.CharField(required=False, allow_blank=True, max_length=10)

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        totp_code = attrs.get('totp_code')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This user account has been disabled.")

        # Check 2FA if enabled
        if user.totp_enabled:
            if not totp_code:
                raise serializers.ValidationError({
                    'code': '2fa_required',
                    'message': 'Two-factor authentication code is required for this account.'
                })
            totp = pyotp.TOTP(user.totp_secret)
            is_valid_totp = totp.verify(totp_code, valid_window=1)
            is_recovery = totp_code in (user.recovery_codes or [])
            if not (is_valid_totp or is_recovery):
                raise serializers.ValidationError("Invalid two-factor authentication code.")
            if is_recovery:
                user.recovery_codes.remove(totp_code)
                user.save(update_fields=['recovery_codes'])

        attrs['user'] = user
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])


class TOTPVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=10)
