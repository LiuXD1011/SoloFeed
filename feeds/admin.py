from django.contrib import admin
from .models import Subscription, Entry, UserEntry

admin.site.register(Subscription)
admin.site.register(Entry)
admin.site.register(UserEntry)
