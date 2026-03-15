from django.contrib import admin

# Register your models here.
import app.models as models
admin.site.register(models.FriendRequest)
admin.site.register(models.Message)
admin.site.register(models.supportMessage)
