# ===========================
# IMPORTS
# ===========================
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status, generics, permissions
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token

from .models import FriendRequest, Message
from .serializers import (
    MessageSerializer,
    SignupSerializer,
    FriendRequestSerializer,
    UserSearchSerializer,
    UserSerializer
)


# ===========================
# AUTHENTICATION
# ===========================

# SIGNUP
class SignupView(CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = Token.objects.create(user=user)

        return Response({
            "message": "User created successfully",
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
        }, status=status.HTTP_201_CREATED)


# LOGIN
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_400_BAD_REQUEST
            )

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
            "last_login": user.last_login,
        })


# ===========================
# USER SEARCH
# ===========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_user(request):

    username = request.GET.get("username", "").strip()

    if not username:
        return Response([])

    users = User.objects.filter(
        username__icontains=username
    ).exclude(id=request.user.id)

    serializer = UserSearchSerializer(
        users,
        many=True,
        context={"request": request}
    )

    return Response(serializer.data)


# ===========================
# FRIEND REQUEST SYSTEM
# ===========================

# SEND REQUEST
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request):

    receiver_id = request.data.get("receiver_id")

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    if receiver == request.user:
        return Response({"error": "Cannot send request to yourself"}, status=400)

    if FriendRequest.objects.filter(
        sender=request.user,
        receiver=receiver,
        status="pending"
    ).exists() or FriendRequest.objects.filter(
        sender=receiver,
        receiver=request.user,
        status="pending"
    ).exists():
        return Response({"error": "Friend request already exists"}, status=400)

    if FriendRequest.objects.filter(
        sender=request.user,
        receiver=receiver,
        status="accepted"
    ).exists() or FriendRequest.objects.filter(
        sender=receiver,
        receiver=request.user,
        status="accepted"
    ).exists():
        return Response({"error": "Already friends"}, status=400)

    friend_request = FriendRequest.objects.create(
        sender=request.user,
        receiver=receiver
    )

    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data, status=201)


# ACCEPT REQUEST
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):

    try:
        friend_request = FriendRequest.objects.get(
            id=request_id,
            receiver=request.user,
            status="pending"
        )
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    friend_request.status = "accepted"
    friend_request.save()

    return Response({"message": "Friend request accepted"})


# REJECT REQUEST
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, request_id):

    try:
        friend_request = FriendRequest.objects.get(
            id=request_id,
            receiver=request.user,
            status="pending"
        )
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    friend_request.status = "rejected"
    friend_request.save()

    return Response({"message": "Friend request rejected"})


# CANCEL REQUEST
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_friend_request(request, request_id):

    try:
        friend_request = FriendRequest.objects.get(id=request_id)
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=404)

    if friend_request.sender != request.user:
        return Response({"error": "Not allowed"}, status=403)

    if friend_request.status != "pending":
        return Response({"error": "Request already processed"}, status=400)

    friend_request.delete()
    return Response({"message": "Friend request canceled"})


# UNFRIEND
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfriend(request, request_id):

    try:
        friend_request = FriendRequest.objects.get(
            id=request_id,
            status="accepted"
        )
    except FriendRequest.DoesNotExist:
        return Response({"error": "Friendship not found"}, status=404)

    if request.user in [friend_request.sender, friend_request.receiver]:
        friend_request.delete()
        return Response({"message": "Unfriended successfully"})

    return Response({"error": "Not authorized"}, status=403)


# ===========================
# FRIEND LIST + REQUESTS
# ===========================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):

    received = FriendRequest.objects.filter(
        receiver=request.user,
        status="pending"
    )

    sent = FriendRequest.objects.filter(
        sender=request.user,
        status="pending"
    )

    received_data = [{
        "id": r.id,
        "sender_username": r.sender.username,
        "created_at": r.created_at
    } for r in received]

    sent_data = [{
        "id": r.id,
        "receiver_username": r.receiver.username,
        "created_at": r.created_at
    } for r in sent]

    return Response({
        "received": received_data,
        "sent": sent_data
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def home_friends(request):

    user = request.user

    friends = FriendRequest.objects.filter(
        Q(sender=user) | Q(receiver=user),
        status="accepted"
    )

    friend_list = []

    for friend in friends:
        friend_user = friend.receiver if friend.sender == user else friend.sender

        friend_list.append({
            "id": friend_user.id,
            "username": friend_user.username,
        })

    return Response(friend_list)


# ===========================
# CHAT SYSTEM
# ===========================

# GET MESSAGES
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):

    current_user = request.user

    Message.objects.filter(
        sender_id=user_id,
        receiver=current_user,
        seen=False
    ).update(seen=True)

    messages = Message.objects.filter(
        Q(sender=current_user, receiver_id=user_id) |
        Q(sender_id=user_id, receiver=current_user)
    ).order_by("timestamp")

    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)


# SEND MESSAGE
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request):

    receiver_id = request.data.get("receiver")
    text = request.data.get("text")

    if not receiver_id or not text:
        return Response({"error": "receiver and text required"}, status=400)

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    message = Message.objects.create(
        sender=request.user,
        receiver=receiver,
        text=text
    )

    serializer = MessageSerializer(message)
    return Response(serializer.data)


# ===========================
# USER PROFILE
# ===========================

def user_detail(request, pk):

    user = get_object_or_404(User, pk=pk)

    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })


class CurrentUserProfileView(generics.RetrieveAPIView):

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user