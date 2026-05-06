import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from .models import VerificationCode


def login_view(request):
    if request.user.is_authenticated:
        return redirect("/")

    if request.method == "POST":
        action = request.POST.get("action")

        if action == "send_code":
            phone = request.POST.get("phone", "")
            if not phone or len(phone) != 11:
                return JsonResponse({"success": False, "error": "请输入正确的手机号"})
            vc = VerificationCode.generate_code(phone)
            response_data = {"success": True}
            response_data["code"] = vc.code
            return JsonResponse(response_data)

        elif action == "login":
            phone = request.POST.get("phone", "")
            code = request.POST.get("code", "")
            user = authenticate(request, phone=phone, code=code)
            if user:
                login(request, user)
                return redirect("/")
            else:
                return render(request, "accounts/login.html", {
                    "error": "验证码错误或已过期",
                    "phone": phone,
                })

    return render(request, "accounts/login.html")


@require_POST
def logout_view(request):
    logout(request)
    return redirect("/login/")
