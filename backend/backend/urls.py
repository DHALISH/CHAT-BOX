from django.contrib import admin
from django.urls import path
from app.views import SignupView, LoginView, search_user, send_friend_request, accept_friend_request, reject_friend_request, cancel_friend_request, unfriend

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/signup/', SignupView.as_view(), name="signup"),
    path('api/login/', LoginView.as_view(), name="login"),
    path("search-user/", search_user, name="search_user"),
    path("friend-request/", send_friend_request, name="send_friend_request"),
    path("friend-request/<int:request_id>/accept/", accept_friend_request, name="accept_friend_request"),
    path("friend-request/<int:request_id>/reject/", reject_friend_request, name="reject_friend_request"),
    path("friend-request/<int:request_id>/cancel/", cancel_friend_request, name="cancel_friend_request"),
    path("friend/<int:request_id>/unfriend/", unfriend, name="unfriend"),

]
