from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class PhoneOTPBackend:
    def authenticate(self, request, phone=None, code=None):
        if phone is None or code is None:
            return None

        try:
            vc = (
                User._default_manager.model.__base__._default_manager  # not used
            )
        except Exception:
            pass

        from accounts.models import VerificationCode

        try:
            vc = VerificationCode.objects.filter(
                phone=phone, code=code, used=False, expires_at__gt=timezone.now()
            ).latest("created_at")
        except VerificationCode.DoesNotExist:
            return None

        vc.used = True
        vc.save()

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            user = User.objects.create_user(phone=phone)

        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
