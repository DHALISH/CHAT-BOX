from django.contrib import admin
from django.urls import path
from app.views import SignupView, LoginView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/signup/', SignupView.as_view(), name="signup"),
    path('api/login/', LoginView.as_view(), name="login"),
]
