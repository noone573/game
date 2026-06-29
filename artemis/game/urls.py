from django.urls import path
from .views import  index, save_player

urlpatterns = [
    path("", index),
    path("save/", save_player),
]