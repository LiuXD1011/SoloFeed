import random
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("手机号不能为空")
        extra_fields.setdefault("nickname", f"用户{phone[-4:]}")
        user = self.model(phone=phone, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractUser):
    username = None
    phone = models.CharField("手机号", max_length=11, unique=True)
    nickname = models.CharField("昵称", max_length=100, default="")
    avatar = models.URLField("头像", max_length=500, blank=True, default="")

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.nickname or self.phone


class VerificationCode(models.Model):
    phone = models.CharField("手机号", max_length=11)
    code = models.CharField("验证码", max_length=6)
    used = models.BooleanField("已使用", default=False)
    expires_at = models.DateTimeField("过期时间")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    @staticmethod
    def generate_code(phone):
        code = f"{random.randint(0, 999999):06d}"
        VerificationCode.objects.filter(phone=phone, used=False).update(used=True)
        return VerificationCode.objects.create(
            phone=phone,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=5),
        )

    def is_valid(self):
        return not self.used and self.expires_at > timezone.now()

    def __str__(self):
        return f"{self.phone}: {self.code}"
