from django.contrib import admin
from django.urls import path

from app.views import (
    SignupView,
    LoginView,
    CurrentUserProfileView,
    search_user,
    send_friend_request,
    accept_friend_request,
    reject_friend_request,
    cancel_friend_request,
    unfriend,
    get_friend_requests,
    home_friends,
    get_messages,
    send_message,
    user_detail,
)

urlpatterns = [

    # ======================
    # ADMIN
    # ======================
    path("admin/", admin.site.urls),

    # ======================
    # AUTH
    # ======================
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/profile/", CurrentUserProfileView.as_view(), name="current-user-profile"),

    # ======================
    # USER
    # ======================
    path("user/<int:pk>/", user_detail, name="user-detail"),
    path("search-user/", search_user, name="search_user"),

    # ======================
    # FRIEND REQUESTS
    # ======================
    path("friend-request/", send_friend_request, name="send_friend_request"),
    path("friend-request/<int:request_id>/accept/", accept_friend_request, name="accept_friend_request"),
    path("friend-request/<int:request_id>/reject/", reject_friend_request, name="reject_friend_request"),
    path("friend-request/<int:request_id>/cancel/", cancel_friend_request, name="cancel_friend_request"),
    path("friend/<int:request_id>/unfriend/", unfriend, name="unfriend"),
    path("friend-requests/", get_friend_requests, name="get_friend_requests"),

    # ======================
    # FRIEND LIST
    # ======================
    path("home-friends/", home_friends, name="home_friends"),

    # ======================
    # CHAT
    # ======================
    path("messages/<int:user_id>/", get_messages, name="get_messages"),
    path("send-message/", send_message, name="send_message"),
]