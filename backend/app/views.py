# Create your views here.
from email.message import Message

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from django.http import JsonResponse
from rest_framework.generics import CreateAPIView, get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from .models import FriendRequest
from .serializers import MessageSerializer, SignupSerializer, FriendRequestSerializer


# ===========================
# SIGNUP
# ===========================
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


# ===========================
# LOGIN
# ===========================
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


# ===========================
# SEARCH USER
# ===========================
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import UserSearchSerializer


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
# SEND FRIEND REQUEST
# ===========================
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    receiver_id = request.data.get("receiver_id")

    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if receiver == request.user:
        return Response(
            {"error": "You cannot send a request to yourself"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent duplicate (both directions)
    if FriendRequest.objects.filter(
        sender=request.user,
        receiver=receiver,
        status="pending"
    ).exists() or FriendRequest.objects.filter(
        sender=receiver,
        receiver=request.user,
        status="pending"
    ).exists():
        return Response(
            {"error": "Friend request already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Prevent if already friends
    if FriendRequest.objects.filter(
        sender=request.user,
        receiver=receiver,
        status="accepted"
    ).exists() or FriendRequest.objects.filter(
        sender=receiver,
        receiver=request.user,
        status="accepted"
    ).exists():
        return Response(
            {"error": "You are already friends"},
            status=status.HTTP_400_BAD_REQUEST
        )

    friend_request = FriendRequest.objects.create(
        sender=request.user,
        receiver=receiver
    )

    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ===========================
# ACCEPT FRIEND REQUEST
# ===========================
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
        return Response(
            {"error": "Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    friend_request.status = "accepted"
    friend_request.save()

    return Response(
        {"message": "Friend request accepted"},
        status=status.HTTP_200_OK
    )


# ===========================
# REJECT FRIEND REQUEST
# ===========================
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
        return Response(
            {"error": "Request not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    friend_request.status = "rejected"
    friend_request.save()

    return Response(
        {"message": "Friend request rejected"},
        status=status.HTTP_200_OK
    )


# ===========================
# CANCEL FRIEND REQUEST
# ===========================
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def cancel_friend_request(request, request_id):

    try:
        friend_request = FriendRequest.objects.get(id=request_id)
    except FriendRequest.DoesNotExist:
        return Response({"error": "Request ID not found"}, status=404)

    if friend_request.sender != request.user:
        return Response({"error": "You cannot cancel this request"}, status=403)

    if friend_request.status != "pending":
        return Response({"error": "Request already accepted/rejected"}, status=400)

    friend_request.delete()

    return Response({"message": "Friend request canceled"})


# ===========================
# UNFRIEND
# ===========================
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfriend(request, request_id):
    try:
        friend_request = FriendRequest.objects.get(
            id=request_id,
            status="accepted"
        )
    except FriendRequest.DoesNotExist:
        return Response(
            {"error": "Friendship not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if friend_request.sender == request.user or friend_request.receiver == request.user:
        friend_request.delete()
        return Response(
            {"message": "Unfriended successfully"},
            status=status.HTTP_200_OK
        )

    return Response(
        {"error": "Not authorized"},
        status=status.HTTP_403_FORBIDDEN
    )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import FriendRequest


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_friend_requests(request):

    received = FriendRequest.objects.filter(receiver=request.user, status="pending")
    sent = FriendRequest.objects.filter(sender=request.user, status="pending")

    received_data = [
        {
            "id": r.id,
            "sender_username": r.sender.username,
            "created_at": r.created_at
        }
        for r in received
    ]

    sent_data = [
        {
            "id": r.id,
            "receiver_username": r.receiver.username,
            "created_at": r.created_at
        }
        for r in sent
    ]

    return Response({
        "received": received_data,
        "sent": sent_data
    })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import FriendRequest

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def home_friends(request):
    user = request.user

    # Get accepted friend requests
    friends = FriendRequest.objects.filter(
        Q(sender=user) | Q(receiver=user),
        status="accepted"
    )

    friend_list = []

    for friend in friends:
        if friend.sender == user:
            friend_user = friend.receiver
        else:
            friend_user = friend.sender

        friend_list.append({
            "id": friend_user.id,
            "username": friend_user.username,
        })

    return Response(friend_list)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Message
from .serializers import MessageSerializer


# GET CHAT MESSAGES
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_messages(request, user_id):

    messages = Message.objects.filter(
        sender__in=[request.user.id, user_id],
        receiver__in=[request.user.id, user_id]
    ).order_by("timestamp")

    # mark received messages as seen
    Message.objects.filter(
        sender_id=user_id,
        receiver=request.user,
        seen=False
    ).update(seen=True)

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

def user_detail(request, pk):
    user = get_object_or_404(User, pk=pk)
    return JsonResponse({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })
    
from rest_framework import generics, permissions
from .serializers import UserSerializer

class CurrentUserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Always return the currently authenticated user
        return self.request.user