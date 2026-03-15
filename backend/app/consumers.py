import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user_from_token(token_key):
    try:
        from rest_framework.authtoken.models import Token
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return None

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.user1 = int(self.scope["url_route"]["kwargs"]["user1"])
        self.user2 = int(self.scope["url_route"]["kwargs"]["user2"])
        
        # Create a consistent room name by sorting user IDs
        self.room_group_name = f"chat_{min(self.user1, self.user2)}_{max(self.user1, self.user2)}"

        print(f"ChatConsumer connect: room={self.room_group_name}, channel={self.channel_name}")

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()


    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    async def receive(self, text_data):

        data = json.loads(text_data)
        message = data["message"]

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message
            }
        )


    async def chat_message(self, event):
        """Handle incoming chat messages"""
        message = event["message"]

        await self.send(text_data=json.dumps({
            "type": "message",
            "message": message
        }))

    async def message_seen(self, event):
        """Handle seen updates"""
        message_id = event["message_id"]
        await self.send(text_data=json.dumps({
            "type": "seen_update",
            "message_id": message_id
        }))



import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework.authtoken.models import Token


@database_sync_to_async
def get_user_from_token(token_key):
    try:
        token = Token.objects.get(key=token_key)
        return token.user
    except Token.DoesNotExist:
        return None


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Get token from query string
        query_string = self.scope.get("query_string", b"").decode()

        token = None
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=")[1]

        # If no token → close connection
        if not token:
            print("WebSocket rejected: No token")
            await self.close()
            return

        # Get user from token
        self.user = await get_user_from_token(token)

        if not self.user:
            print("WebSocket rejected: Invalid token")
            await self.close()
            return

        # Create unique group for the user
        self.group_name = f"user_{self.user.id}"

        # Join notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        print(f"Notification WebSocket connected for user {self.user.id}")

        await self.accept()

    async def disconnect(self, close_code):

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

        print(f"Notification WebSocket disconnected for user {self.user.id}")

    async def notification_message(self, event):
        """
        Triggered when a new message notification is sent
        """
        await self.send(
            text_data=json.dumps(event["data"])
        )

    async def message_seen(self, event):
        """
        Triggered when a message is marked as seen
        """
        await self.send(
            text_data=json.dumps({
                "type": "seen_update",
                "message_id": event["message_id"],
                "other_user_id": event["other_user_id"]
            })
        )
