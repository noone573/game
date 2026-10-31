"""Makes the drawing guides and sprite frames for the game.

Run from the game folder:

    python tools/make_sprites.py           # create anything that's missing
    python tools/make_sprites.py --force   # redraw ALL placeholder frames (overwrites drawings!)

What it does:
  - assets/templates/frames/<move>/<n>.png   a drawing guide for every frame (always refreshed)
  - for every fighter in data/fighters/*.js, in its sprites folder:
      * an old one-picture sprites.png sheet is split into <move>/<n>.png frames
        (kept as original-sheet.png); existing frames are never overwritten
      * a fighter with no frames yet gets plain stick figure frames in its colors
      * projectiles/<move>.png placeholder pictures for moves that fire a shot
  - assets/maps/map-template.png

Needs Pillow:  pip install pillow
"""
import math
import os
import re
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FORCE = "--force" in sys.argv

F = 256          # frame size in pixels
COLS = 6
GROUND = 240     # the "feet" line inside each frame
CX = 128

# Must match SPRITE.animations in js/engine/sprites.js (same order).
ANIMS = [
    ("IDLE", 4), ("WALK", 6), ("JUMP", 3), ("PUNCH", 3), ("KICK", 3), ("BLOCK", 2),
    ("HURT", 2), ("KO", 3), ("UPPERCUT", 3), ("DROPKICK", 3), ("DISRUPT", 3), ("SPECIAL", 3),
    ("SPECIAL UP", 3), ("SPECIAL DOWN", 3), ("SPECIAL FWD", 3), ("SPECIAL BACK", 3),
    ("SPECIAL PUNCH", 3), ("SPECIAL KICK", 3),
]
W, H = F * COLS, F * len(ANIMS)

# Folder name for each row above (same order). These are the animation names
# the game uses, so frames live at <fighter folder>/<key>/<n>.png.
ANIM_KEYS = [
    "idle", "walk", "jump", "punch", "kick", "block", "hurt", "ko", "uppercut", "dropkick",
    "disrupt", "special", "specialUp", "specialDown", "specialForward", "specialBack",
    "specialPunch", "specialKick",
]

# Frame 2 of these rows is the moment the move hits (or fires).
HIT_ROWS = {"PUNCH", "KICK", "UPPERCUT", "DROPKICK", "DISRUPT", "SPECIAL UP", "SPECIAL DOWN",
            "SPECIAL FWD", "SPECIAL BACK", "SPECIAL PUNCH", "SPECIAL KICK"}


# ---------- stick figure poses ----------
# Angles are in degrees from straight down; positive = toward the front.
# bt/bs = back thigh/shin, ft/fs = front thigh/shin, bu/bf = back upper/fore arm,
# fu/ff = front upper/fore arm (arms are measured relative to the body lean).

def P(**kw):
    base = dict(dx=0, dy=0, lean=4, bt=-12, bs=-14, ft=20, fs=4,
                bu=15, bf=135, fu=35, ff=150, ground=True)
    base.update(kw)
    return base


def poses():
    out = {}
    out["IDLE"] = [P(bt=-12 + k, bs=-14 - k, ft=20 + 2 * k, fs=4 - 2 * k, ff=150 + k) for k in (0, 2, 4, 2)]
    walk = []
    for i in range(6):
        ph = 2 * math.pi * i / 6
        s, c = math.sin(ph), math.cos(ph)
        ft, bt = 6 + 24 * s, 6 - 24 * s
        walk.append(P(lean=7, ft=ft, fs=ft - 22 * (0.5 + 0.5 * c), bt=bt, bs=bt - 22 * (0.5 - 0.5 * c),
                      fu=35 + 6 * s, bu=15 - 6 * s))
    out["WALK"] = walk
    out["JUMP"] = [
        P(ground=False, dy=-6, lean=2, bt=-6, bs=-14, ft=8, fs=-4, fu=55, ff=170, bu=35, bf=165),
        P(ground=False, dy=-30, lean=10, bt=55, bs=-25, ft=95, fs=8, fu=40, ff=150, bu=20, bf=140),
        P(ground=False, dy=-14, lean=0, bt=-16, bs=-6, ft=28, fs=14, fu=75, ff=115, bu=-35, bf=10),
    ]
    out["PUNCH"] = [
        P(lean=-4, fu=-25, ff=110, bu=40, bf=150, ft=22, fs=6),
        P(lean=12, dx=6, fu=78, ff=78, bu=10, bf=140, ft=34, fs=16, bt=-26, bs=-20),
        P(lean=7, dx=3, fu=60, ff=115, bu=15, bf=140, ft=28, fs=10),
    ]
    out["KICK"] = [
        P(lean=-8, ft=88, fs=-8, bt=-4, bs=-6, fu=40, ff=150, bu=20, bf=140),
        P(lean=-24, ft=96, fs=96, bt=-8, bs=-4, fu=55, ff=150, bu=-25, bf=15),
        P(lean=-10, ft=60, fs=12, bt=-6, bs=-8, fu=40, ff=150),
    ]
    out["BLOCK"] = [
        P(lean=-4, ft=26, fs=0, bt=-16, bs=-22, fu=18, ff=176, bu=32, bf=172),
        P(lean=-14, dx=-8, ft=30, fs=6, bt=-20, bs=-24, fu=12, ff=172, bu=28, bf=168),
    ]
    out["HURT"] = [
        P(lean=-22, dx=-8, fu=-35, ff=-15, bu=-50, bf=-25, ft=26, fs=14, bt=-20, bs=-10),
        P(lean=-12, dx=-4, fu=-15, ff=40, bu=-30, bf=10, ft=22, fs=8, bt=-16, bs=-12),
    ]
    out["KO"] = [
        P(lean=-32, dx=-10, fu=-50, ff=-30, bu=-65, bf=-40, ft=30, fs=18, bt=-22, bs=-8),
        P(ground=False, lean=-62, dx=-6, dy=34, fu=-40, ff=-10, bu=-60, bf=-30, ft=72, fs=80, bt=60, bs=70),
        P(ground=False, lean=-90, dy=72, fu=150, ff=175, bu=165, bf=185, ft=86, fs=92, bt=80, bs=96),
    ]
    out["UPPERCUT"] = [
        P(lean=14, ft=40, fs=-8, bt=-14, bs=-34, fu=5, ff=-20, bu=40, bf=150),
        P(ground=False, dy=-4, lean=-6, ft=20, fs=6, bt=-10, bs=-16, fu=165, ff=178, bu=30, bf=150),
        P(lean=0, fu=120, ff=160, bu=20, bf=140, ft=24, fs=6),
    ]
    out["DROPKICK"] = [
        P(ground=False, dy=-34, lean=-25, ft=80, fs=20, bt=60, bs=-5, fu=-30, ff=20, bu=-40, bf=0),
        P(ground=False, dy=-14, dx=-14, lean=-68, ft=100, fs=100, bt=96, bs=96, fu=-80, ff=-60, bu=-95, bf=-70),
        P(lean=-12, ft=40, fs=-6, bt=-20, bs=-36, fu=40, ff=150, bu=10, bf=140),
    ]
    out["DISRUPT"] = [
        P(lean=-10, fu=-40, ff=60, bu=-50, bf=50, ft=22, fs=6),
        P(lean=16, dx=10, fu=82, ff=96, bu=76, bf=92, ft=36, fs=16, bt=-28, bs=-20),
        P(lean=6, dx=4, fu=60, ff=130, bu=40, bf=120, ft=28, fs=10),
    ]
    out["SPECIAL"] = [
        P(lean=-12, dx=-4, fu=-60, ff=20, bu=-70, bf=10, ft=26, fs=6, bt=-18, bs=-20),
        P(lean=10, dx=6, fu=86, ff=88, bu=80, bf=84, ft=34, fs=14, bt=-26, bs=-20),
        P(lean=4, fu=60, ff=120, bu=30, bf=130, ft=26, fs=8),
    ]
    out["SPECIAL UP"] = [
        P(lean=16, ft=44, fs=-10, bt=-16, bs=-38, fu=10, ff=-10, bu=0, bf=-20),
        P(ground=False, dy=-6, lean=-4, ft=10, fs=0, bt=-20, bs=-10, fu=170, ff=178, bu=160, bf=176),
        P(ground=False, dy=-10, lean=0, ft=60, fs=10, bt=40, bs=-20, fu=120, ff=150, bu=110, bf=140),
    ]
    out["SPECIAL DOWN"] = [
        P(lean=-6, fu=170, ff=175, bu=160, bf=170, ft=24, fs=4),
        P(lean=30, ft=50, fs=-10, bt=-20, bs=-40, fu=20, ff=10, bu=10, bf=0),
        P(lean=10, ft=30, fs=0, fu=40, ff=120),
    ]
    out["SPECIAL FWD"] = [
        P(lean=-10, dx=-6, fu=-30, ff=90, bu=-40, bf=60, ft=30, fs=10, bt=-20, bs=-24),
        P(lean=28, dx=12, fu=84, ff=86, bu=-60, bf=-40, ft=50, fs=30, bt=-50, bs=-40),
        P(lean=10, dx=6, fu=60, ff=120, ft=30, fs=10),
    ]
    out["SPECIAL BACK"] = [
        P(lean=-4, fu=60, ff=170, bu=50, bf=165, ft=26, fs=0, bt=-16, bs=-22),
        P(lean=-8, fu=110, ff=120, bu=-110, bf=-120, ft=34, fs=10, bt=-30, bs=-20),
        P(lean=0, fu=40, ff=150),
    ]
    out["SPECIAL PUNCH"] = [
        P(lean=-16, dx=-8, fu=-70, ff=-20, bu=50, bf=150, ft=24, fs=4, bt=-18, bs=-20),
        P(lean=20, dx=14, fu=82, ff=82, bu=-30, bf=20, ft=42, fs=22, bt=-34, bs=-26),
        P(lean=8, dx=6, fu=60, ff=110, ft=30, fs=10),
    ]
    out["SPECIAL KICK"] = [
        P(lean=-14, ft=100, fs=10, bt=-4, bs=-4, fu=40, ff=150, bu=-30, bf=10),
        P(lean=-36, ft=126, fs=126, bt=-6, bs=-2, fu=60, ff=140, bu=-60, bf=-20),
        P(lean=-12, ft=70, fs=14, bt=-6, bs=-8, fu=40, ff=150),
    ]
    return out


def vec(a, l):
    r = math.radians(a)
    return (math.sin(r) * l, math.cos(r) * l)


def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def skeleton(p):
    hip = (CX + p["dx"], 150 + p["dy"])
    lr = math.radians(p["lean"])
    up = (math.sin(lr), -math.cos(lr))
    fwd = (math.cos(lr), math.sin(lr))
    at = lambda d: (hip[0] + up[0] * d, hip[1] + up[1] * d)
    sh = at(52)

    def limb(origin, a1, l1, a2, l2):
        j = add(origin, vec(a1, l1))
        return j, add(j, vec(a2, l2))

    sk = dict(hip=hip, neck=at(58), head=at(84), sh=sh, up=up, fwd=fwd)
    sk["bk"], sk["bfoot"] = limb(hip, p["bt"], 45, p["bs"], 45)
    sk["fk"], sk["ffoot"] = limb(hip, p["ft"], 45, p["fs"], 45)
    sk["be"], sk["bh"] = limb(sh, p["bu"] + p["lean"], 35, p["bf"] + p["lean"], 32)
    sk["fe"], sk["fh"] = limb(sh, p["fu"] + p["lean"], 35, p["ff"] + p["lean"], 32)
    sk["bsa"], sk["fsa"] = p["bs"], p["fs"]

    if p["ground"]:
        shift = GROUND - 6 - max(sk["bfoot"][1], sk["ffoot"][1])
        for k, v in list(sk.items()):
            if isinstance(v, tuple) and k not in ("up", "fwd"):
                sk[k] = (v[0], v[1] + shift)
    return sk


def draw_figure(d, ox, oy, p, pal, outline=True):
    sk = skeleton(p)
    o = lambda pt: (pt[0] + ox, pt[1] + oy)

    def seg(a, b, w, col):
        a, b = o(a), o(b)
        layers = [(w + 7, pal["outline"]), (w, col)] if outline else [(w, col)]
        for width, c in layers:
            d.line([a, b], fill=c, width=int(width))
            for pt in (a, b):
                r = width / 2
                d.ellipse([pt[0] - r, pt[1] - r, pt[0] + r, pt[1] + r], fill=c)

    def dot(c, r, col):
        c = o(c)
        if outline:
            d.ellipse([c[0] - r - 3.5, c[1] - r - 3.5, c[0] + r + 3.5, c[1] + r + 3.5], fill=pal["outline"])
        d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=col)

    def boot(ankle, shin_angle, col):
        r = math.radians(shin_angle)
        seg(ankle, add(ankle, (math.cos(r) * 14, -math.sin(r) * 14)), 13, col)

    # back limbs first so the front ones overlap them
    seg(sk["sh"], sk["be"], 13, pal["back"]); seg(sk["be"], sk["bh"], 12, pal["back"]); dot(sk["bh"], 8, pal["back"])
    seg(sk["hip"], sk["bk"], 16, pal["back"]); seg(sk["bk"], sk["bfoot"], 14, pal["back"]); boot(sk["bfoot"], sk["bsa"], pal["boot"])
    seg(sk["hip"], sk["neck"], 32, pal["main"])
    seg(sk["hip"], sk["fk"], 16, pal["main"]); seg(sk["fk"], sk["ffoot"], 14, pal["main"]); boot(sk["ffoot"], sk["fsa"], pal["boot"])
    dot(sk["head"], 22, pal["head"])
    up, fwd = sk["up"], sk["fwd"]
    v1 = add(sk["head"], (fwd[0] * 1 + up[0] * 2, fwd[1] * 1 + up[1] * 2))
    v2 = add(sk["head"], (fwd[0] * 19 + up[0] * 2, fwd[1] * 19 + up[1] * 2))
    if outline:
        d.line([o(v1), o(v2)], fill=pal["visor"], width=10)
        d.line([o(add(v1, (fwd[0] * 4, fwd[1] * 4))), o(v2)], fill=pal["accent"], width=3)
    seg(sk["sh"], sk["fe"], 13, pal["main"]); seg(sk["fe"], sk["fh"], 12, pal["main"]); dot(sk["fh"], 9, pal["main"])


# ---------- colors ----------

def hex_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def palette(fighter):
    main = hex_rgb(fighter["color"])
    dark = hex_rgb(fighter["dark"])
    accent = hex_rgb(fighter["accent"])
    return dict(main=main + (255,), back=mix(main, dark, 0.55) + (255,), outline=(8, 16, 28, 255),
                head=(220, 233, 255, 255), visor=dark + (255,), accent=accent + (255,), boot=(17, 23, 42, 255))


def read_fighters():
    """Pulls the id, colors and sprites folder out of each data/fighters/*.js file."""
    folder = os.path.join(ROOT, "data", "fighters")
    fighters = []
    for name in sorted(os.listdir(folder)):
        if not name.endswith(".js"):
            continue
        text = open(os.path.join(folder, name), encoding="utf-8").read()
        found = {key: re.search(rf'\b{key}:\s*"([^"]+)"', text)
                 for key in ("id", "color", "dark", "accent", "sprites")}
        if all(found.values()):
            fighter = {key: match.group(1) for key, match in found.items()}
            sprites_path = fighter["sprites"]
            if sprites_path.endswith(".png"):
                sprites_path = os.path.dirname(sprites_path)
            fighter["folder"] = sprites_path
            fighter["file"] = name
            fighters.append(fighter)
    return fighters


# ---------- frames ----------

def placeholder_frame(pal, name, index):
    img = Image.new("RGBA", (F, F), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_figure(d, 0, 0, poses()[name][index], pal)
    if name == "SPECIAL" and index == 1:
        # energy ball leaving the hands (the game also draws its own)
        cx, cy = 236, 100
        for r, a in ((18, 90), (12, 200)):
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=pal["main"][:3] + (a,))
        d.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=pal["accent"])
    return img


def dashed(d, a, b, col, dash=8, width=1):
    length = math.dist(a, b)
    for i in range(int(length // (dash * 2)) + 1):
        t0 = (i * dash * 2) / length
        t1 = min(1, (i * dash * 2 + dash) / length)
        d.line([(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0),
                (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)], fill=col, width=width)


def guide_frame(name=None, index=0, count=0):
    """One frame of the drawing guide: feet line, body box, pose ghost, label."""
    img = Image.new("RGBA", (F, F), (247, 249, 253, 255))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=18)
    small = ImageFont.load_default(size=13)
    if name:
        ghost = {k: (196, 206, 222, 255) for k in ("main", "back", "head", "boot", "outline")}
        ghost.update(visor=(150, 165, 190, 255), accent=(150, 165, 190, 255))
        draw_figure(d, 0, 0, poses()[name][index], ghost)
    # the body the game uses for hits (48 x 100 at half scale)
    for a, b in [((80, 40), (176, 40)), ((176, 40), (176, GROUND)), ((80, 40), (80, GROUND))]:
        dashed(d, a, b, (255, 120, 170))
    dashed(d, (CX, 8), (CX, F - 8), (120, 150, 200), dash=5)
    d.line([(8, GROUND), (F - 8, GROUND)], fill=(40, 170, 220), width=2)
    d.text((CX + 6, GROUND + 3), "feet", fill=(40, 170, 220), font=small)
    if name:
        d.text((10, 8), f"{name} {index + 1}/{count}", fill=(40, 52, 76), font=font)
        if index == 1 and (name in HIT_ROWS or name == "SPECIAL"):
            d.text((F - 10, 30), "FIRE!" if name == "SPECIAL" else "HIT!", fill=(230, 60, 120), font=font, anchor="ra")
    else:
        d.text((10, 8), "blank frame", fill=(40, 52, 76), font=font)
    d.text((10, F - 22), "face RIGHT", fill=(150, 156, 168), font=small)
    d.rectangle([0, 0, F - 1, F - 1], outline=(120, 132, 156), width=1)
    return img


def split_grid_sheet(sheet):
    """A sheet drawn exactly on the 6 x 18 template grid: cut it cell by cell."""
    size = sheet.width // COLS
    frames = {}
    for row, (key, (_, count)) in enumerate(zip(ANIM_KEYS, ANIMS)):
        for col in range(count):
            cell = sheet.crop((col * size, row * size, (col + 1) * size, (row + 1) * size))
            if cell.getbbox():
                frames[(key, col)] = cell
    return frames


def split_loose_sheet(sheet):
    """Any other sheet: find each row of drawings, cut every drawing out of its
    column, and line its feet up on the feet line of a square frame."""
    alpha = sheet.getchannel("A")
    width, height = sheet.size
    px = alpha.load()

    # rows of drawings = horizontal bands that contain pixels
    bands, start = [], None
    for y in range(height + 1):
        filled = y < height and any(px[x, y] > 20 for x in range(width))
        if filled and start is None:
            start = y
        elif not filled and start is not None:
            if bands and start - bands[-1][1] < 6:
                bands[-1] = (bands[-1][0], y)
            else:
                bands.append((start, y))
            start = None
    bands = [b for b in bands if b[1] - b[0] >= 12]  # ignore stray specks

    cell_w = width / COLS
    pitch = height / max(len(bands), 1)
    size = int(math.ceil(max(cell_w, pitch)))
    feet_y = round(size * GROUND / F)
    frames = {}

    for row, (y0, y1) in enumerate(bands[:len(ANIM_KEYS)]):
        key = ANIM_KEYS[row]
        for col in range(COLS):
            x0, x1 = round(col * cell_w), round((col + 1) * cell_w)
            piece = sheet.crop((x0, max(0, y0 - 4), x1, min(height, y1 + 4)))
            box = piece.getbbox()
            if not box:
                continue
            frame = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            # center of the column -> middle of the frame, bottom of the drawing -> feet line
            frame.alpha_composite(piece, (round(size / 2 - (x1 - x0) / 2), feet_y - box[3]))
            frames[(key, col)] = frame
    return frames


def frame_path(folder, key, index):
    return os.path.join(folder, key, f"{index + 1}.png")


def fill_missing_from(folder, key, source_key):
    """Copy another animation's frames as a starting point for a missing one."""
    count = dict(zip(ANIM_KEYS, (n for _, n in ANIMS)))[key]
    copied = 0
    for i in range(count):
        target = frame_path(folder, key, i)
        source = frame_path(folder, source_key, min(i, count - 1))
        if not os.path.exists(target) and os.path.exists(source):
            os.makedirs(os.path.dirname(target), exist_ok=True)
            Image.open(source).save(target, optimize=True)
            copied += 1
    if copied:
        print(f"  {key}: no frames yet, copied {source_key} as a starting point")


# If a split sheet has no row for a move, start it from a similar move.
STAND_INS = {
    "specialPunch": "punch", "specialKick": "kick", "specialUp": "uppercut",
    "specialDown": "special", "specialForward": "special", "specialBack": "block",
    "uppercut": "punch", "dropkick": "kick", "disrupt": "punch", "special": "punch",
}


def prepare_fighter(fighter):
    folder = os.path.join(ROOT, fighter["folder"])
    os.makedirs(folder, exist_ok=True)
    name = os.path.relpath(folder, ROOT)
    sheet_path = os.path.join(folder, "sprites.png")

    # 1. An old single-picture sheet: split it into frames (never overwrites a frame).
    if os.path.exists(sheet_path):
        sheet = Image.open(sheet_path).convert("RGBA")
        exact = sheet.width % COLS == 0 and sheet.width // COLS * len(ANIMS) == sheet.height
        frames = split_grid_sheet(sheet) if exact else split_loose_sheet(sheet)
        written = 0
        for (key, col), img in frames.items():
            path = frame_path(folder, key, col)
            if not os.path.exists(path):
                os.makedirs(os.path.dirname(path), exist_ok=True)
                img.save(path, optimize=True)
                written += 1
        backup = os.path.join(folder, "original-sheet.png")
        if os.path.exists(backup):
            os.remove(backup)
        os.rename(sheet_path, backup)
        print(f"{name}: split sprites.png into {written} frames (kept it as original-sheet.png)")
        for key, stand_in in STAND_INS.items():
            if not os.path.isdir(os.path.join(folder, key)):
                fill_missing_from(folder, key, stand_in)

    # The old whole-sheet drawing template is replaced by assets/templates/frames/.
    old_template = os.path.join(folder, "template.png")
    if os.path.exists(old_template):
        os.remove(old_template)

    # 2. No frames at all yet: plain stick figure placeholders in the fighter's colors.
    has_frames = any(os.path.isdir(os.path.join(folder, key)) for key in ANIM_KEYS)
    if not has_frames or FORCE:
        pal = palette(fighter)
        for (label, count), key in zip(ANIMS, ANIM_KEYS):
            for i in range(count):
                path = frame_path(folder, key, i)
                if FORCE or not os.path.exists(path):
                    os.makedirs(os.path.dirname(path), exist_ok=True)
                    placeholder_frame(pal, label, i).save(path, optimize=True)
        print(f"{name}: wrote placeholder frames")


# ---------- projectiles ----------
# Pictures face RIGHT (the way the shot flies). Ground shockwaves are wide and short.

def read_projectile_moves(fighter):
    """[(move key, is a ground wave)] for every move in the fighter file that fires a projectile."""
    path = os.path.join(ROOT, "data", "fighters", fighter["file"])
    text = open(path, encoding="utf-8").read()
    moves = []
    for found in re.finditer(r"projectile:\s*\{([^}]*)\}", text):
        before = text[:found.start()]
        keys = re.findall(r"^\s{4}(\w+):\s*\{", before, flags=re.M)
        if keys:
            moves.append((keys[-1], "bothWays: true" in found.group(1)))
    return moves


def soft_shadow(img, offset=4):
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow.paste((26, 15, 8, 110), mask=img.getchannel("A"))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(shadow, (offset, offset))
    out.alpha_composite(img)
    return out


def projectile_ball(kind, color):
    S = 128
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if kind == "egg":
        d.ellipse([34, 18, 94, 110], fill=(255, 246, 224, 255), outline=(150, 120, 80, 255), width=4)
        d.ellipse([46, 30, 64, 58], fill=(255, 255, 255, 255))
        for i in range(7):
            x, y = 44 + seeded(i) * 40, 60 + seeded(i + 9) * 40
            d.ellipse([x, y, x + 5, y + 4], fill=(205, 170, 120, 255))
    elif kind == "mud":
        d.ellipse([22, 26, 106, 104], fill=(122, 80, 48, 255), outline=(70, 44, 24, 255), width=4)
        for i in range(6):
            x, y = 34 + seeded(i + 3) * 56, 38 + seeded(i + 13) * 50
            r = 5 + seeded(i + 23) * 7
            d.ellipse([x, y, x + r, y + r], fill=(92, 58, 32, 255))
        d.ellipse([40, 36, 58, 50], fill=(160, 112, 72, 255))
        for x in (40, 70, 92):
            d.ellipse([x - 6, 98, x + 4, 116], fill=(122, 80, 48, 255))
    elif kind == "milk":
        d.ellipse([24, 30, 100, 100], fill=(255, 255, 255, 255), outline=(170, 190, 210, 255), width=4)
        for x, y, r in ((96, 40, 14), (104, 76, 10), (14, 60, 9), (30, 100, 8), (86, 104, 8)):
            d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255), outline=(170, 190, 210, 255), width=3)
        d.ellipse([40, 42, 60, 56], fill=(225, 238, 250, 255))
    elif kind == "bark":
        for i, r in enumerate((22, 40, 58)):
            d.arc([64 - r, 64 - r, 64 + r, 64 + r], start=-55, end=55,
                  fill=color + (255 - i * 50,), width=12 - i * 2)
        d.ellipse([28, 52, 52, 76], fill=color + (255,))
    else:
        d.ellipse([20, 20, 108, 108], fill=color + (120,))
        d.ellipse([36, 36, 92, 92], fill=color + (255,))
        d.ellipse([52, 52, 76, 76], fill=(255, 255, 255, 255))
    return soft_shadow(img)


def projectile_wave(kind, color):
    W2, H2 = 192, 64
    img = Image.new("RGBA", (W2, H2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    dust = {"egg": (240, 214, 150), "milk": (255, 255, 255), "mud": (122, 80, 48)}.get(kind, color)
    # a rolling cloud of dust/milk/mud, tallest at the front
    for i in range(9):
        x = 16 + i * 20
        r = 10 + i * 2.6
        d.ellipse([x - r, H2 - 6 - r * 1.6, x + r, H2 - 6], fill=dust + (150 + i * 11,))
    if kind == "egg":
        for x in (120, 160):
            d.ellipse([x - 12, 14, x + 12, 46], fill=(255, 246, 224, 255), outline=(150, 120, 80, 255), width=3)
    for i in range(6):
        x = 40 + seeded(i + 40) * 140
        y = 8 + seeded(i + 50) * 24
        d.ellipse([x, y, x + 7, y + 6], fill=dust + (230,))
    return soft_shadow(img, 3)


# What each animal throws; anything else gets a glowing ball in its color.
PROJECTILE_KIND = {"chicken": "egg", "pig": "mud", "cow": "milk", "dog": "bark"}


def prepare_projectiles(fighter):
    folder = os.path.join(ROOT, fighter["folder"], "projectiles")
    kind = PROJECTILE_KIND.get(fighter["id"].lower(), "ball")
    color = hex_rgb(fighter["color"])
    made = []
    for key, ground in read_projectile_moves(fighter):
        path = os.path.join(folder, f"{key}.png")
        if os.path.exists(path) and not FORCE:
            continue
        os.makedirs(folder, exist_ok=True)
        image = projectile_wave(kind, color) if ground else projectile_ball(kind, color)
        image.save(path, optimize=True)
        made.append(key)
    if made:
        print(f"{os.path.relpath(folder, ROOT)}: wrote {', '.join(made)}")


def seeded(n):
    value = math.sin(n * 12.9898 + 78.233) * 43758.5453
    return value - math.floor(value)


def map_template():
    MW, MH, FLOOR = 1280, 720, 590
    img = Image.new("RGBA", (MW, MH), (24, 30, 52, 255))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=20)
    small = ImageFont.load_default(size=15)
    for gx in range(0, MW, 40):
        d.line([(gx, 0), (gx, MH)], fill=(34, 42, 68), width=1)
    for gy in range(0, MH, 40):
        d.line([(0, gy), (MW, gy)], fill=(34, 42, 68), width=1)
    d.rectangle([0, 0, MW, 133], fill=(60, 30, 50, 255))
    d.text((MW / 2, 66), "HEALTH BARS + TIMER GO HERE - keep this area simple", fill=(255, 150, 190), font=font, anchor="mm")
    d.rectangle([0, FLOOR, MW, MH], fill=(18, 40, 60, 255))
    d.line([(0, FLOOR), (MW, FLOOR)], fill=(67, 231, 255), width=4)
    d.text((MW / 2, FLOOR + 50), "FLOOR - fighters stand on the blue line (y = 590)", fill=(67, 231, 255), font=font, anchor="mm")
    jump = FLOOR - 124
    for gx in range(0, MW, 24):
        d.line([(gx, jump), (gx + 12, jump)], fill=(248, 237, 118), width=2)
    d.text((12, jump - 22), "highest a fighter can jump from the floor (y = 466)", fill=(248, 237, 118), font=small)
    for x0 in (300, 932):
        d.rectangle([x0, FLOOR - 100, x0 + 48, FLOOR], outline=(200, 210, 230), width=2)
    d.text((324, FLOOR - 112), "P1", fill=(200, 210, 230), font=small, anchor="mm")
    d.text((956, FLOOR - 112), "P2", fill=(200, 210, 230), font=small, anchor="mm")
    d.text((MW / 2, 290), "Paint your arena background over this (1280 x 720)", fill=(220, 228, 245), font=font, anchor="mm")
    return img


def save(img, *parts):
    path = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, optimize=True)


def main():
    # Drawing guides, one picture per frame.
    for (label, count), key in zip(ANIMS, ANIM_KEYS):
        for i in range(count):
            save(guide_frame(label, i, count), "assets", "templates", "frames", key, f"{i + 1}.png")
    save(guide_frame(), "assets", "templates", "blank-frame.png")
    old = os.path.join(ROOT, "assets", "templates", "sprite-template.png")
    if os.path.exists(old):
        os.remove(old)
    print("wrote assets/templates/frames/ (drawing guides)")

    save(map_template(), "assets", "maps", "map-template.png")

    for fighter in read_fighters():
        prepare_fighter(fighter)
        prepare_projectiles(fighter)


if __name__ == "__main__":
    main()
