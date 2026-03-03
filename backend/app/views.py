# Create your views here.
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework import status
from .serializers import SignupSerializer



class SignupView(CreateAPIView):
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = Token.objects.get(user=user)

        return Response({
            "message": "User created successfully",
            "token": token.key,
            "user_id": user.id,
            "username": user.username,
        })


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
        }, status=status.HTTP_200_OK)
    
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_user(request):
    query = request.GET.get("username", "")

    if query:
        users = User.objects.filter(username__icontains=query).exclude(id=request.user.id)
        data = [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
            for user in users
        ]
        return Response(data)

    return Response([], status=status.HTTP_200_OK)
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import FriendRequest
from .serializers import FriendRequestSerializer

# Send friend request
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    receiver_id = request.data.get("receiver_id")
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    if receiver == request.user:
        return Response({"error": "You cannot send a request to yourself"}, status=status.HTTP_400_BAD_REQUEST)

    if FriendRequest.objects.filter(sender=request.user, receiver=receiver, status="pending").exists():
        return Response({"error": "Request already sent"}, status=status.HTTP_400_BAD_REQUEST)

    friend_request = FriendRequest.objects.create(sender=request.user, receiver=receiver)
    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# Accept friend request
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    friend_request.status = "accepted"
    friend_request.save()
    return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)


# Reject friend request
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    friend_request.status = "rejected"
    friend_request.save()
    return Response({"message": "Friend request rejected"}, status=status.HTTP_200_OK)


# Cancel friend request (sender cancels)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_friend_request(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, sender=request.user, status="pending")
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

    friend_request.delete()
    return Response({"message": "Friend request canceled"}, status=status.HTTP_200_OK)


# Unfriend (delete accepted friendship)
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfriend(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(id=request_id, status="accepted")
    except FriendRequest.DoesNotExist:
        return Response({"error": "Friendship not found"}, status=status.HTTP_404_NOT_FOUND)

    if friend_request.sender == request.user or friend_request.receiver == request.user:
        friend_request.delete()
        return Response({"message": "Unfriended successfully"}, status=status.HTTP_200_OK)

    return Response({"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)