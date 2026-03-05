from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"]
        )

        # ✅ Create token automatically
        Token.objects.create(user=user)

        return user

from rest_framework import serializers
from .models import FriendRequest

class FriendRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FriendRequest
        fields = ["id", "sender", "receiver", "status", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]

from rest_framework import serializers
from django.contrib.auth.models import User
from django.db.models import Q
from .models import FriendRequest


from django.db.models import Q

class UserSearchSerializer(serializers.ModelSerializer):
    request_status = serializers.SerializerMethodField()
    request_id = serializers.SerializerMethodField()
    request_sender_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "request_status",
            "request_id",
            "request_sender_id"
        ]

    def get_friend_request(self, obj):
        current_user = self.context["request"].user

        return FriendRequest.objects.filter(
            Q(sender=current_user, receiver=obj) |
            Q(sender=obj, receiver=current_user)
        ).first()

    def get_request_status(self, obj):
        request = self.get_friend_request(obj)
        return request.status if request else None

    def get_request_id(self, obj):
        request = self.get_friend_request(obj)
        return request.id if request else None

    def get_request_sender_id(self, obj):
        request = self.get_friend_request(obj)
        return request.sender.id if request else None