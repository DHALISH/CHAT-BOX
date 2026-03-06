from django import views
from django.contrib import admin
from django.urls import path
from app.views import CurrentUserProfileView, SignupView, LoginView,  get_friend_requests, get_messages, home_friends, search_user, send_friend_request, accept_friend_request, reject_friend_request, cancel_friend_request, send_message, unfriend, user_detail

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
    path("friend-requests/", get_friend_requests, name="get_friend_requests"),
    path("home-friends/", home_friends),
    path("messages/<int:user_id>/", get_messages, name="get_messages"),
    path("send-message/", send_message, name="send_message"),  
    path("user/<int:pk>/", user_detail, name="user-detail"),
    path("api/profile/", CurrentUserProfileView.as_view(), name="current-user-profile"),
]
    
    
    
    


