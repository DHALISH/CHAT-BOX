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