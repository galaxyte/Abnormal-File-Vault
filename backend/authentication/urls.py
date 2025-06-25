
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('verify/', views.verify_token, name='verify-token'),
    path('profile/', views.profile_view, name='profile'),
]
