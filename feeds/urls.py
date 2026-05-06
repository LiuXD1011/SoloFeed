from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("entries/load-more/", views.load_more_entries, name="load_more"),
    path("entries/refresh/<int:sub_id>/", views.refresh_feed, name="refresh_feed"),
    path("discover/", views.discover, name="discover"),
    path("subscriptions/add/", views.subscription_add, name="subscription_add"),
    path("subscriptions/<int:pk>/delete/", views.subscription_delete, name="subscription_delete"),
    path("subscriptions/", views.subscriptions, name="subscriptions"),
    path("profile/", views.profile, name="profile"),
]
