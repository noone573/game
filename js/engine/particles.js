// Sparks that fly off hits.
"use strict";

function createHitParticles(x, y, color, amount = 12) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 100 + Math.random() * 320;

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.25 + Math.random() * 0.35,
      maxLife: 0.6,
      size: 2 + Math.random() * 5,
      color,
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 12
    });
  }
}

function updateParticles(dt) {
  particles = particles.filter((particle) => particle.life > 0);

  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    particle.vx *= Math.exp(-2 * dt);
    particle.vy *= Math.exp(-2 * dt);
    particle.vy += 180 * dt;

    particle.angle += particle.spin * dt;
    particle.life -= dt;
  }
}

function drawParticles() {
  ctx.save();

  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;

    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.angle);
    ctx.fillRect(
      -particle.size / 2,
      -particle.size / 2,
      particle.size,
      particle.size * 0.55
    );
    ctx.restore();
  }

  ctx.restore();
}
