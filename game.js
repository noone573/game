
"use strict";

// =============================================
// 1. SETUP
// =============================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const FLOOR = 440;
const GRAVITY = 1500;
const MOVE_SPEED = 300;
const JUMP_SPEED = 610;

const keys = new Set();

let gameState = "title";
let countdown = 0;
let winner = "";
let lastTime = 0;
let screenShake = 0;
let particles = [];

// =============================================
// 2. FIGHTER CLASS
// =============================================

class Fighter {
    constructor(name, x, color, controls) {
        this.name = name;
        this.startX = x;
        this.color = color;
        this.controls = controls;
        this.width = 48;
        this.height = 100;

        this.reset();
    }

    reset() {
        this.x = this.startX;
        this.y = FLOOR - this.height;
        this.vx = 0;
        this.vy = 0;

        this.health = 100;
        this.facing = this.startX < WIDTH / 2 ? 1 : -1;
        this.grounded = true;

        this.attackType = "";
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.hasHit = false;
        this.hurtTimer = 0;
    }

    get centerX() {
        return this.x + this.width / 2;
    }

    update(dt, opponent) {
        this.attackCooldown = Math.max(
            0, this.attackCooldown - dt
        );
        this.hurtTimer = Math.max(0, this.hurtTimer - dt);
        this.attackTimer = Math.max(0, this.attackTimer - dt);

        // Always face the opponent.
        this.facing = opponent.centerX > this.centerX ? 1 : -1;

        this.vx = 0;

        if (this.health <= 0 || gameState !== "fighting") {
            this.vx = 0;
        } else if (this.attackTimer <= 0.12) {
            if (keys.has(this.controls.left)) {
                this.vx = -MOVE_SPEED;
            }

            if (keys.has(this.controls.right)) {
                this.vx = MOVE_SPEED;
            }
        }

        this.x += this.vx * dt;

        // Keep the fighter inside the arena.
        this.x = Math.max(
            10,
            Math.min(WIDTH - this.width - 10, this.x)
        );

        // Jump physics.
        if (!this.grounded) {
            this.vy += GRAVITY * dt;
            this.y += this.vy * dt;
        }

        if (this.y + this.height >= FLOOR) {
            this.y = FLOOR - this.height;
            this.vy = 0;
            this.grounded = true;
        }
    }

    jump() {
        if (
            gameState === "fighting" &&
            this.grounded &&
            this.health > 0
        ) {
            this.vy = -JUMP_SPEED;
            this.grounded = false;
        }
    }

    attack(type) {
        if (
            gameState !== "fighting" ||
            this.health <= 0 ||
            this.attackCooldown > 0 ||
            this.attackTimer > 0
        ) {
            return;
        }

        this.attackType = type;
        this.attackTimer = type === "kick" ? 0.36 : 0.28;
        this.attackCooldown = type === "kick" ? 0.58 : 0.38;
        this.hasHit = false;
    }

    getAttackBox() {
        const isKick = this.attackType === "kick";
        const range = isKick ? 88 : 65;
        const boxHeight = isKick ? 44 : 48;

        return {
            x: this.facing === 1
                ? this.x + this.width
                : this.x - range,
            y: this.y + (isKick ? 48 : 20),
            width: range,
            height: boxHeight
        };
    }

    tryHit(opponent) {
        // Attack is active only during this short window.
        if (
            !this.attackType ||
            this.attackTimer <= 0.06 ||
            this.attackTimer > (this.attackType === "kick" ? 0.27 : 0.21) ||
            this.hasHit ||
            opponent.health <= 0
        ) {
            return;
        }

        const a = this.getAttackBox();

        const b = {
            x: opponent.x,
            y: opponent.y,
            width: opponent.width,
            height: opponent.height
        };

        const overlaps =
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;

        if (overlaps) {
            const damage = this.attackType === "kick" ? 12 : 7;

            opponent.health = Math.max(
                0, opponent.health - damage
            );

            opponent.vx = this.facing * 220;
            opponent.vy = -140;
            opponent.grounded = false;
            opponent.hurtTimer = 0.16;

            this.hasHit = true;
            screenShake = 5;

            createHitParticles(
                opponent.centerX,
                opponent.y + opponent.height / 2,
                opponent.color
            );
        }
    }

    draw() {
        ctx.save();

        // Character shadow.
        ctx.fillStyle = "#02040b99";
        ctx.beginPath();
        ctx.ellipse(
            this.centerX,
            FLOOR + 2,
            37,
            8,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.translate(this.centerX, this.y);
        ctx.scale(this.facing, 1);

        const isAttacking = this.attackTimer > 0;
        const isKick = this.attackType === "kick" && isAttacking;

        // Neon glow.
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.hurtTimer > 0 ? 25 : 14;

        // Legs.
        ctx.fillStyle = this.color;
        ctx.fillRect(-17, 65, 14, 30);
        ctx.fillRect(4, 65, 14, 30);

        // Boots.
        ctx.fillStyle = "#11172a";
        ctx.fillRect(-21, 88, 21, 10);
        ctx.fillRect(1, 88, 21, 10);

        // Body armor.
        ctx.fillStyle = this.hurtTimer > 0 ? "#ffffff" : this.color;
        ctx.beginPath();
        ctx.moveTo(-21, 30);
        ctx.lineTo(20, 30);
        ctx.lineTo(16, 68);
        ctx.lineTo(-16, 68);
        ctx.closePath();
        ctx.fill();

        // Chest detail.
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#11172a";
        ctx.fillRect(-10, 40, 20, 15);

        // Head.
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#dce9ff";
        ctx.fillRect(-14, 5, 28, 26);

        // Visor.
        ctx.fillStyle = "#10162b";
        ctx.fillRect(-12, 12, 24, 9);

        ctx.fillStyle = this.color;
        ctx.fillRect(0, 15, 10, 3);

        // Arm / attack animation.
        ctx.fillStyle = this.color;

        if (isAttacking && !isKick) {
            ctx.fillRect(12, 33, 37, 12);
            ctx.fillRect(39, 31, 15, 15);
        } else {
            ctx.fillRect(12, 34, 12, 30);
        }

        ctx.fillRect(-23, 35, 12, 25);

        // Kicking leg.
        if (isKick) {
            ctx.fillRect(3, 63, 48, 12);
            ctx.fillRect(41, 59, 15, 20);
        }

        ctx.restore();
    }
}

// =============================================
// 3. CREATE THE PLAYERS
// =============================================

const player1 = new Fighter(
    "CYBER",
    220,
    "#36d9ff",
    {
        left: "a",
        right: "d",
        jump: "w",
        punch: "f",
        kick: "g"
    }
);

const player2 = new Fighter(
    "PHANTOM",
    690,
    "#ff4fa3",
    {
        left: "arrowleft",
        right: "arrowright",
        jump: "arrowup",
        punch: "k",
        kick: "l"
    }
);

// =============================================
// 4. KEYBOARD INPUT
// =============================================

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();

    if ([
        "arrowleft",
        "arrowright",
        "arrowup",
        " "
    ].includes(key)) {
        event.preventDefault();
    }

    // Ignore key repeat for actions.
    if (keys.has(key)) return;

    keys.add(key);

    if (key === "enter" && gameState !== "countdown") {
        startGame();
        return;
    }

    if (gameState !== "fighting") return;

    handleAction(player1, key);
    handleAction(player2, key);
});

window.addEventListener("keyup", (event) => {
    keys.delete(event.key.toLowerCase());
});

function handleAction(fighter, key) {
    if (key === fighter.controls.jump) {
        fighter.jump();
    }

    if (key === fighter.controls.punch) {
        fighter.attack("punch");
    }

    if (key === fighter.controls.kick) {
        fighter.attack("kick");
    }
});

startButton.addEventListener("click", startGame);

// =============================================
// 5. GAME STATES
// =============================================

function startGame() {
    player1.reset();
    player2.reset();

    keys.clear();
    particles = [];
    winner = "";
    screenShake = 0;

    countdown = 2.5;
    gameState = "countdown";
}

function endGame() {
    if (player1.health <= 0) {
        winner = player2.name;
    } else if (player2.health <= 0) {
        winner = player1.name;
    } else {
        return;
    }

    gameState = "over";
    startButton.textContent = "FIGHT AGAIN";
}

// =============================================
// 6. PARTICLE EFFECTS
// =============================================

function createHitParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 220;

        particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.25,
            color
        });
    }
}

function updateParticles(dt) {
    particles = particles.filter(p => p.life > 0);

    for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 250 * dt;
        p.life -= dt;
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / 0.55);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 5, 5);
    }

    ctx.globalAlpha = 1;
}

// =============================================
// 7. DRAW THE ARENA
// =============================================

function drawBackground() {
    const bg = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bg.addColorStop(0, "#10152e");
    bg.addColorStop(1, "#080a16");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Background lights.
    for (let i = 0; i < 9; i++) {
        const x = i * 120 + 20;

        ctx.fillStyle = i % 2 === 0
            ? "#173454"
            : "#351b45";

        ctx.fillRect(x, 115, 65, 180);

        ctx.fillStyle = "#ffffff0b";
        ctx.fillRect(x + 7, 125, 5, 160);
    }

    // Perspective floor grid.
    ctx.strokeStyle = "#24365c";
    ctx.lineWidth = 1;

    for (let y = 450; y < HEIGHT; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WIDTH, y);
        ctx.stroke();
    }

    for (let x = -500; x <= 1400; x += 80) {
        ctx.beginPath();
        ctx.moveTo(WIDTH / 2, FLOOR);
        ctx.lineTo(x, HEIGHT);
        ctx.stroke();
    }

    // Arena floor line.
    ctx.shadowColor = "#36d9ff";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#36d9ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR);
    ctx.lineTo(WIDTH, FLOOR);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// =============================================
// 8. HEALTH BARS AND UI
// =============================================

function drawHealthBar(x, y, width, health, color, flip) {
    ctx.fillStyle = "#080b18";
    ctx.fillRect(x, y, width, 23);

    ctx.strokeStyle = "#6c7898";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 23);

    const fillWidth = width * health / 100;

    ctx.fillStyle = color;

    if (flip) {
        ctx.fillRect(x + width - fillWidth, y, fillWidth, 23);
    } else {
        ctx.fillRect(x, y, fillWidth, 23);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = flip ? "right" : "left";
    ctx.fillText(`${Math.ceil(health)} HP`, flip ? x + width : x, y - 7);
}

function drawHUD() {
    drawHealthBar(40, 45, 350, player1.health, "#36d9ff", false);
    drawHealthBar(570, 45, 350, player2.health, "#ff4fa3", true);

    ctx.textAlign = "left";
    ctx.fillStyle = "#36d9ff";
    ctx.font = "bold 15px Arial";
    ctx.fillText("CYBER", 40, 30);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ff4fa3";
    ctx.fillText("PHANTOM", 920, 30);

    ctx.textAlign = "center";
    ctx.fillStyle = "#dbe4ff";
    ctx.font = "bold 16px Arial";
    ctx.fillText("VS", WIDTH / 2, 60);
}

// =============================================
// 9. OVERLAYS
// =============================================

function drawOverlay(title, subtitle, color) {
    ctx.fillStyle = "#050816d9";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = "center";
    ctx.shadowColor = color;
    ctx.shadowBlur = 25;
    ctx.fillStyle = color;
    ctx.font = "bold 52px Arial";
    ctx.fillText(title, WIDTH / 2, 220);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.font = "18px Arial";
    ctx.fillText(subtitle, WIDTH / 2, 270);
}

function draw() {
    ctx.save();

    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }

    drawBackground();
    drawHUD();
    player1.draw();
    player2.draw();
    drawParticles();

    ctx.restore();

    if (gameState === "title") {
        drawOverlay(
            "NEON CLASH",
            "PRESS ENTER OR CLICK START FIGHT",
            "#36d9ff"
        );
    } else if (gameState === "countdown") {
        drawOverlay(
            countdown > 1 ? "READY?" : "FIGHT!",
            "GET READY TO BATTLE",
            "#ffffff"
        );

        ctx.fillStyle = "#ff4fa3";
        ctx.font = "bold 65px Arial";
        ctx.textAlign = "center";

        if (countdown > 1) {
            ctx.fillText(
                Math.ceil(countdown - 1),
                WIDTH / 2,
                350
            );
        }
    } else if (gameState === "over") {
        drawOverlay(
            `${winner} WINS!`,
            "PRESS ENTER OR CLICK FIGHT AGAIN",
            winner === "CYBER" ? "#36d9ff" : "#ff4fa3"
        );
    }
}

// =============================================
// 10. MAIN GAME LOOP
// =============================================

function update(dt) {
    if (gameState === "countdown") {
        countdown -= dt;

        if (countdown <= 0) {
            gameState = "fighting";
        }
    }

    if (gameState === "fighting") {
        player1.update(dt, player2);
        player2.update(dt, player1);

        player1.tryHit(player2);
        player2.tryHit(player1);

        if (player1.health <= 0 || player2.health <= 0) {
            endGame();
        }
    }

    updateParticles(dt);
    screenShake = Math.max(0, screenShake - 25 * dt);
}

function gameLoop(timestamp) {
    const dt = Math.min(
        (timestamp - lastTime) / 1000 || 0,
        0.033
    );

    lastTime = timestamp;

    update(dt);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start the game renderer.
startButton.textContent = "START FIGHT";
requestAnimationFrame(gameLoop);
