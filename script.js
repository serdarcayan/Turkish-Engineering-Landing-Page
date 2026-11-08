      // === PARALLAX (fare + jiroskop) ===
      const layers = document.querySelectorAll(
        ".front, .mid, .back, h1, article, img"
      );

      // hedef ve mevcut değerler (smoothing için)
      let targetX = 0,
        targetY = 0;
      let currentX = 0,
        currentY = 0;
      const ease = 0.08;

      function clamp(v, a, b) {
        return Math.max(a, Math.min(b, v));
      }

      // fare ile hedefleri ayarla (aynı normalizasyon ile -1..1 aralığı)
      function onMouseMove(e) {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        targetX = clamp(x, -1, 1);
        targetY = clamp(y, -1, 1);
      }
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseleave", () => {
        targetX = 0;
        targetY = 0;
      });

      // cihaz oryantasyonu -> hedef değerleri belirle
      function handleOrientation(e) {
        if (e.gamma == null) return; // destek yoksa çık
        // gamma: sağ-sol [-90,90], beta: öne-arkaya [-180,180]
        // hassasiyeti ayarlamak için bölümler (deneyerek değiştirilebilir)
        const gamma = e.gamma;
        const beta = e.beta;

        // daha yumuşak kontrol için bölüme ayır (ör: 30)
        const x = clamp(gamma / 30, -1, 1); // sağa eğilince pozitif
        const y = clamp(beta / 30, -1, 1); // öne eğilince pozitif
        targetX = x;
        targetY = y;
      }

      // iOS 13+ için izin isteği; diğer platformlarda doğrudan dinleyici ekler
      async function enableGyroIfNeeded() {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof DeviceOrientationEvent.requestPermission === "function"
        ) {
          try {
            const res = await DeviceOrientationEvent.requestPermission();
            if (res === "granted") {
              window.addEventListener("deviceorientation", handleOrientation);
            }
          } catch (err) {
            console.warn("Gyro permission denied or error:", err);
          }
        } else {
          // normal cihazlarda doğrudan ekle
          window.addEventListener("deviceorientation", handleOrientation);
        }

        // tek seferlik kullanıcı etkileşimi gerektiren çağrıyı kaldır
        window.removeEventListener("touchend", enableGyroIfNeeded);
        window.removeEventListener("click", enableGyroIfNeeded);
      }

      // iOS'da izin gerektirebileceği için kullanıcı etkileşimi bekle
      window.addEventListener("touchend", enableGyroIfNeeded, {
        passive: true,
      });
      window.addEventListener("click", enableGyroIfNeeded, { passive: true });

      // sürekli olarak güncelle ve easing uygula
      function applyTransforms() {
        currentX += (targetX - currentX) * ease;
        currentY += (targetY - currentY) * ease;

        layers.forEach((layer, index) => {
          const depth = (index + 1) * 10;
          const tx = currentX * depth;
          const ty = currentY * depth;
          const rx = currentY * 5;
          const ry = -currentX * 5;

          layer.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });

        requestAnimationFrame(applyTransforms);
      }

      applyTransforms();

      // === KAMANLI (FOG / LIGHT PARTICLES) EFEKTİ ===
      const canvas = document.getElementById("fog");
      const ctx = canvas.getContext("2d");

      let w, h, particles;

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        createParticles();
      }

      window.addEventListener("resize", resize);

      class Particle {
        constructor() {
          this.reset();
        }

        reset() {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
          this.size = Math.random() * 150 + 50;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.speedY = (Math.random() - 0.5) * 0.3;
          this.alpha = Math.random() * 0.15 + 0.05;
          this.hue = 180 + Math.random() * 60;
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (
            this.x < -this.size ||
            this.x > w + this.size ||
            this.y < -this.size ||
            this.y > h + this.size
          ) {
            this.reset();
          }
        }

        draw() {
          const gradient = ctx.createRadialGradient(
            this.x,
            this.y,
            0,
            this.x,
            this.y,
            this.size
          );
          gradient.addColorStop(
            0,
            `hsla(${this.hue}, 100%, 60%, ${this.alpha})`
          );
          gradient.addColorStop(1, "transparent");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function createParticles() {
        particles = [];
        for (let i = 0; i < 25; i++) {
          particles.push(new Particle());
        }
      }

      function animate() {
        ctx.clearRect(0, 0, w, h);
        particles.forEach((p) => {
          p.update();
          p.draw();
        });
        requestAnimationFrame(animate);
      }

      resize();
      animate();
