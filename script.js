const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !motionPreference.matches) {
  const layers = document.querySelectorAll(".front, .mid, .back, .content, .logo");
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId = 0;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateParallax() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    layers.forEach((layer, index) => {
      const depth = (index + 1) * 4;
      layer.style.transform = `translate3d(${currentX * depth}px, ${currentY * depth}px, 0)`;
    });

    if (Math.abs(targetX - currentX) > 0.01 || Math.abs(targetY - currentY) > 0.01) {
      frameId = requestAnimationFrame(updateParallax);
    } else {
      frameId = 0;
    }
  }

  function setTarget(x, y) {
    targetX = clamp(x, -1, 1);
    targetY = clamp(y, -1, 1);
    if (!frameId) frameId = requestAnimationFrame(updateParallax);
  }

  document.addEventListener("pointermove", (event) => {
    setTarget(
      (event.clientX / window.innerWidth - 0.5) * 2,
      (event.clientY / window.innerHeight - 0.5) * 2
    );
  }, { passive: true });
  document.addEventListener("pointerleave", () => setTarget(0, 0), { passive: true });
}

const canvas = document.getElementById("fog");
const context = canvas.getContext("2d", { alpha: true });

if (!context) {
  console.error("Canvas 2D context is not available; the animated background is disabled.");
} else {
  const isSmallScreen = window.matchMedia("(max-width: 600px)");
  const frameInterval = 1000 / 30;
  let width = 0;
  let height = 0;
  let particles = [];
  let animationFrame = 0;
  let lastFrameTime = 0;

  class Particle {
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 100 + 50;
      this.speedX = (Math.random() - 0.5) * 0.2;
      this.speedY = (Math.random() - 0.5) * 0.2;
      this.alpha = Math.random() * 0.12 + 0.04;
      this.hue = 180 + Math.random() * 60;
    }

    constructor() {
      this.reset();
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < -this.size || this.x > width + this.size ||
          this.y < -this.size || this.y > height + this.size) {
        this.reset();
      }
    }

    draw() {
      const gradient = context.createRadialGradient(
        this.x, this.y, 0, this.x, this.y, this.size
      );
      gradient.addColorStop(0, `hsla(${this.hue}, 100%, 60%, ${this.alpha})`);
      gradient.addColorStop(1, "transparent");
      context.fillStyle = gradient;
      context.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    }
  }

  function resizeCanvas() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isSmallScreen.matches ? 1 : 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    particles = Array.from({ length: isSmallScreen.matches ? 6 : 12 }, () => new Particle());
    drawFrame();
  }

  function drawFrame() {
    context.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      particle.update();
      particle.draw();
    });
  }

  function animate(timestamp) {
    if (timestamp - lastFrameTime >= frameInterval) {
      lastFrameTime = timestamp;
      drawFrame();
    }
    animationFrame = requestAnimationFrame(animate);
  }

  function updateAnimationState() {
    if (document.hidden || motionPreference.matches) {
      cancelAnimationFrame(animationFrame);
      animationFrame = 0;
      return;
    }
    if (!animationFrame) {
      lastFrameTime = 0;
      animationFrame = requestAnimationFrame(animate);
    }
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  document.addEventListener("visibilitychange", updateAnimationState);
  motionPreference.addEventListener("change", updateAnimationState);
  resizeCanvas();
  updateAnimationState();
}
