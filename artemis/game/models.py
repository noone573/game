from django.db import models


class Player(models.Model):
    x = models.IntegerField(default=5)
    y = models.IntegerField(default=5)
    hp = models.IntegerField(default=100)
    max_hp = models.IntegerField(default=100)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Player at ({self.x}, {self.y}) — HP: {self.hp}/{self.max_hp}"

    class Meta:
        verbose_name = "Player"


class Enemy(models.Model):
    x = models.IntegerField()
    y = models.IntegerField()
    hp = models.IntegerField(default=30)
    max_hp = models.IntegerField(default=30)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Enemy at ({self.x}, {self.y}) — HP: {self.hp}/{self.max_hp}"

    class Meta:
        verbose_name = "Enemy"
        verbose_name_plural = "Enemies"