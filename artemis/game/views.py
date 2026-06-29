import json
from django.http import JsonResponse
from django.shortcuts import render
from .models import Player, Enemy

def index(request):
    return render(request, "game/index.html")


def save_player(request):
    """Save player position and HP to the database."""
    if request.method == "POST":
        data = json.loads(request.body)

        x = data.get("x")
        y = data.get("y")
        hp = data.get("hp")

        # Example with a Player model:
        # Player.objects.update_or_create(
        #     id=1,
        #     defaults={"x": x, "y": y, "hp": hp}
        # )

        return JsonResponse({"status": "saved"})


def load_player(request):
    """Return saved player position and HP."""
    if request.method == "GET":

        # Example with a Player model:
        # player = Player.objects.get(id=1)
        # return JsonResponse({"x": player.x, "y": player.y, "hp": player.hp})

        # Placeholder default response
        return JsonResponse({"x": 5, "y": 5, "hp": 100})


def save_enemies(request):
    """Save the current enemy list to the database."""
    if request.method == "POST":
        data = json.loads(request.body)

        enemies = data.get("enemies", [])
        # enemies is a list of dicts: [{"x": 10, "y": 10, "hp": 30}, ...]

        # Example with an Enemy model:
        # Enemy.objects.all().delete()
        # for e in enemies:
        #     Enemy.objects.create(x=e["x"], y=e["y"], hp=e["hp"])

        return JsonResponse({"status": "saved", "count": len(enemies)})


def load_enemies(request):
    """Return the list of enemies with their positions and HP."""
    if request.method == "GET":

        # Example with an Enemy model:
        # enemies = list(Enemy.objects.values("x", "y", "hp", "maxHp"))
        # return JsonResponse({"enemies": enemies})

        # Placeholder default enemies
        enemies = [
            {"x": 15, "y": 15, "hp": 30, "maxHp": 30},
            {"x": 30, "y": 20, "hp": 30, "maxHp": 30},
            {"x": 20, "y": 40, "hp": 30, "maxHp": 30},
        ]
        return JsonResponse({"enemies": enemies})


def attack(request):
    """
    Handle a player attack.
    Receives player position and list of enemies hit.
    Returns updated enemy states (removes dead ones).
    """
    if request.method == "POST":
        data = json.loads(request.body)

        player_x = data.get("playerX")
        player_y = data.get("playerY")
        hit_enemies = data.get("hitEnemies", [])
        # hit_enemies: [{"x": 10, "y": 10, "damage": 25}, ...]

        results = []
        for hit in hit_enemies:
            ex, ey, dmg = hit.get("x"), hit.get("y"), hit.get("damage", 25)

            # Example with an Enemy model:
            # try:
            #     enemy = Enemy.objects.get(x=ex, y=ey)
            #     enemy.hp -= dmg
            #     if enemy.hp <= 0:
            #         enemy.delete()
            #         results.append({"x": ex, "y": ey, "hp": 0, "dead": True})
            #     else:
            #         enemy.save()
            #         results.append({"x": ex, "y": ey, "hp": enemy.hp, "dead": False})
            # except Enemy.DoesNotExist:
            #     pass

            # Placeholder: just echo back with damage applied
            remaining_hp = max(0, 30 - dmg)
            results.append({
                "x": ex,
                "y": ey,
                "hp": remaining_hp,
                "dead": remaining_hp <= 0
            })

        return JsonResponse({"status": "ok", "results": results})


def take_damage(request):
    """
    Called when an enemy hits the player.
    Returns updated player HP.
    """
    if request.method == "POST":
        data = json.loads(request.body)

        damage = data.get("damage", 10)

        # Example with a Player model:
        # player = Player.objects.get(id=1)
        # player.hp = max(0, player.hp - damage)
        # player.save()
        # return JsonResponse({"hp": player.hp, "dead": player.hp <= 0})

        # Placeholder
        return JsonResponse({"status": "ok", "damage_received": damage})