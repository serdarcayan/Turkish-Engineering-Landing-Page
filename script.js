const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!motionPreference.matches) {
  const layers = document.querySelectorAll(".front, .mid, .back, .content, .logo");
  const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const supportsOrientation = "DeviceOrientationEvent" in window;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let frameId = 0;
  let initialGamma;
  let initialBeta;
  let gyroActive = false;
  let permissionRequested = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function updateParallax() {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    layers.forEach((layer, index) => {
      const depth = (index + 1) * 10;
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

  function handleOrientation(event) {
    if (event.gamma === null || event.beta === null) return;
    if (initialGamma === undefined || initialBeta === undefined) {
      initialGamma = event.gamma;
      initialBeta = event.beta;
      gyroActive = true;
    }

    setTarget(
      (event.gamma - initialGamma) / 20,
      (event.beta - initialBeta) / 20
    );
  }

  document.addEventListener("pointermove", (event) => {
    if (gyroActive) return;
    setTarget(
      (event.clientX / window.innerWidth - 0.5) * 2,
      (event.clientY / window.innerHeight - 0.5) * 2
    );
  }, { passive: true });
  document.addEventListener("pointerleave", () => {
    if (!gyroActive) setTarget(0, 0);
  }, { passive: true });

  if (hasCoarsePointer && supportsOrientation) {
    window.addEventListener("deviceorientation", handleOrientation, { passive: true });

    if (typeof DeviceOrientationEvent.requestPermission === "function") {
      document.addEventListener("pointerdown", () => {
        if (permissionRequested) return;
        permissionRequested = true;
        DeviceOrientationEvent.requestPermission().then((permission) => {
          if (permission !== "granted") {
            console.info("Device orientation permission was not granted; using pointer parallax.");
          }
        }).catch((error) => {
          console.warn("Device orientation permission was not granted; using pointer parallax.", error);
        });
      }, { once: true, passive: true });
    }
  }
}

const iconWallCanvas = document.getElementById("iconWall");
const iconWallContext = iconWallCanvas.getContext("2d", { alpha: true });

if (!iconWallContext) {
  console.error("Canvas 2D context is not available; the icon wall is disabled.");
} else {
  const iconNames = [
    "BIO_ENGINEERING",
    "CHEMISTRY",
    "CODE",
    "ELECTRIC",
    "ELECTRONIC",
    "ENDUSTRY",
    "MATH",
    "MECHANIC",
    "SOFTWARE",
  ];
  const isSmallScreen = window.matchMedia("(max-width: 600px)");
  const icons = iconNames.map((name) => {
    const image = new Image();
    image.addEventListener("load", drawIconWall);
    image.addEventListener("error", () => {
      console.error(`Unable to load background icon: assets/heroIcons/${name}.png`);
    }, { once: true });
    image.src = `assets/heroIcons/${name}.png`;
    return image;
  });
  let wallWidth = 0;
  let wallHeight = 0;

  function drawIconWall() {
    if (!wallWidth || !wallHeight) return;

    iconWallContext.clearRect(0, 0, wallWidth, wallHeight);
    const spacingX = isSmallScreen.matches ? 205 : 260;
    const spacingY = isSmallScreen.matches ? 205 : 230;
    const columns = Math.ceil(wallWidth / spacingX) + 1;
    const rows = Math.ceil(wallHeight / spacingY) + 1;
    const cellWidth = wallWidth / columns;
    const cellHeight = wallHeight / rows;

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const seed = (row * 73 + column * 137 + row * column * 17) % 997;
        if (seed % 5 === 0) continue;

        const icon = icons[seed % icons.length];
        if (!icon.complete || !icon.naturalWidth) continue;

        const centerX = (column + 0.5) * cellWidth + (row % 2 ? cellWidth * 0.12 : 0);
        const centerY = (row + 0.5) * cellHeight;
        const jitter = isSmallScreen.matches ? 10 : 24;
        const x = centerX + ((seed % 7) - 3) * jitter / 3;
        const y = centerY + (((seed * 3) % 7) - 3) * jitter / 3;
        const maxSize = isSmallScreen.matches ? 30 : 44;
        const size = Math.min(maxSize, Math.min(cellWidth, cellHeight) * 0.2) *
          (0.82 + (seed % 5) * 0.08);

        const glow = iconWallContext.createRadialGradient(x, y, 0, x, y, size * 1.8);
        glow.addColorStop(0, "rgba(96, 165, 250, 0.12)");
        glow.addColorStop(1, "rgba(96, 165, 250, 0)");
        iconWallContext.fillStyle = glow;
        iconWallContext.beginPath();
        iconWallContext.arc(x, y, size * 1.8, 0, Math.PI * 2);
        iconWallContext.fill();

        iconWallContext.save();
        iconWallContext.translate(x, y);
        iconWallContext.rotate(((seed % 9) - 4) * 0.025);
        iconWallContext.globalAlpha = isSmallScreen.matches ? 0.68 : 0.58;
        iconWallContext.shadowColor = "rgba(96, 165, 250, 0.28)";
        iconWallContext.shadowBlur = isSmallScreen.matches ? 7 : 12;
        iconWallContext.drawImage(icon, -size / 2, -size / 2, size, size);
        iconWallContext.restore();
      }
    }
  }

  function resizeIconWall() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    wallWidth = window.innerWidth;
    wallHeight = window.innerHeight;
    iconWallCanvas.width = Math.round(wallWidth * pixelRatio);
    iconWallCanvas.height = Math.round(wallHeight * pixelRatio);
    iconWallContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawIconWall();
  }

  window.addEventListener("resize", resizeIconWall, { passive: true });
  resizeIconWall();
}

const canvas = document.getElementById("fog");
const context = canvas.getContext("2d", { alpha: true });

if (!context) {
  console.error("Canvas 2D context is not available; the animated background is disabled.");
} else {
  const isSmallScreen = window.matchMedia("(max-width: 600px)");
  const frameInterval = 1000 / 10;
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
