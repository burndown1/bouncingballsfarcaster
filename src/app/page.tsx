'use client'; // Client-side çalıştığını belirtir, tarayıcıda çalışacak kodları tanımlar

import { useEffect, useRef } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Çember merkezi ve yarıçapı
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const circleRadius = 200;

    // Logo (top) ayarları
    let logo1X = centerX + circleRadius - 50; // 1. logo (Galatasaray)
    let logo1Y = centerY;
    let logo1DX = 2; // x hareket hızı
    let logo1DY = 1; // y hareket hızı
    const logoRadius = 20;

    let logo2X = centerX - circleRadius + 50; // 2. logo (Fenerbahçe)
    let logo2Y = centerY;
    let logo2DX = -2; // x hareket hızı
    let logo2DY = -1; // y hareket hızı

    // Kale ayarları
    let goalAngle = 0; // Kale dönme açısı
    const goalWidth = 80; // Dikdörtgen kale genişliği
    const goalHeight = 40; // Dikdörtgen kale yüksekliği
    let score = 0;

    // Logo resimleri (local path ile)
    const logo1Img = new Image();
    logo1Img.src = '/galatasaray_logo.png'; // public klasörüne kopyala
    const logo2Img = new Image();
    logo2Img.src = '/fenerbahce_logo.png'; // public klasörüne kopyala

    let isLogo1Loaded = false;
    let isLogo2Loaded = false;
    const handleLogoLoad = () => {
      isLogo1Loaded = logo1Img.complete && logo1Img.naturalWidth > 0;
      isLogo2Loaded = logo2Img.complete && logo2Img.naturalWidth > 0;
      if (isLogo1Loaded && isLogo2Loaded) {
        draw(); // Resimler yüklendiğinde çizimi başlat
      }
    };

    logo1Img.onload = handleLogoLoad;
    logo2Img.onload = handleLogoLoad;

    const drawCircle = () => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'lime'; // Neon yeşil
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.closePath();
    };

    const drawLogo = (x: number, y: number, img: HTMLImageElement) => {
      if (img.complete && img.naturalWidth > 0) { // Resim yüklenmiş mi kontrolü
        ctx.drawImage(img, x - logoRadius, y - logoRadius, logoRadius * 2, logoRadius * 2);
      }
    };

    const drawGoal = () => {
      const goalX = centerX + Math.cos(goalAngle) * circleRadius; // Çember çizgisi üzerinde
      const goalY = centerY + Math.sin(goalAngle) * circleRadius;
      ctx.beginPath();
      ctx.rect(goalX - goalWidth / 2, goalY - goalHeight / 2, goalWidth, goalHeight);
      ctx.fillStyle = 'yellow'; // Neon sarı
      ctx.fill();
      ctx.closePath();
      goalAngle += 0.02; // Kale dönme hızı
    };

    const drawScore = () => {
      ctx.font = '24px Arial';
      ctx.fillStyle = 'white'; // Neon beyaz
      ctx.fillText(`Score: ${score}`, 10, canvas.height - 30); // Alt tarafta
    };

    const resetGame = () => {
      logo1X = centerX + circleRadius - 50;
      logo1Y = centerY;
      logo1DX = 2;
      logo1DY = 1;
      logo2X = centerX - circleRadius + 50;
      logo2Y = centerY;
      logo2DX = -2;
      logo2DY = -1;
    };

    const draw = () => {
      if (!isLogo1Loaded || !isLogo2Loaded) return; // Resimler yüklenene kadar bekle

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCircle();
      drawLogo(logo1X, logo1Y, logo1Img); // Galatasaray logosu
      drawLogo(logo2X, logo2Y, logo2Img); // Fenerbahçe logosu
      drawGoal();
      drawScore();

      // Logo hareketi
      logo1X += logo1DX;
      logo1Y += logo1DY;
      logo2X += logo2DX;
      logo2Y += logo2DY;

      // Çember çarpması
      const dist1 = Math.sqrt((logo1X - centerX) ** 2 + (logo1Y - centerY) ** 2);
      const dist2 = Math.sqrt((logo2X - centerX) ** 2 + (logo2Y - centerY) ** 2);
      if (dist1 >= circleRadius - logoRadius) {
        const angle = Math.atan2(logo1Y - centerY, logo1X - centerX);
        logo1X = centerX + (circleRadius - logoRadius) * Math.cos(angle);
        logo1Y = centerY + (circleRadius - logoRadius) * Math.sin(angle);
        logo1DX *= -1.5; // Sert zıplama
        logo1DY *= -1.5;
        logo1DX *= 0.9; // Yavaşlama
        logo1DY *= 0.9;
      }
      if (dist2 >= circleRadius - logoRadius) {
        const angle = Math.atan2(logo2Y - centerY, logo2X - centerX);
        logo2X = centerX + (circleRadius - logoRadius) * Math.cos(angle);
        logo2Y = centerY + (circleRadius - logoRadius) * Math.sin(angle);
        logo2DX *= -1.5; // Sert zıplama
        logo2DY *= -1.5;
        logo2DX *= 0.9; // Yavaşlama
        logo2DY *= 0.9;
      }

      // Logo çarpması
      const dx = logo2X - logo1X;
      const dy = logo2Y - logo1Y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 2 * logoRadius) {
        logo1DX *= -1.5; // Sert zıplama
        logo1DY *= -1.5;
        logo2DX *= -1.5; // Sert zıplama
        logo2DY *= -1.5;
        logo1DX *= 0.9; // Yavaşlama
        logo1DY *= 0.9;
        logo2DX *= 0.9; // Yavaşlama
        logo2DY *= 0.9;
      }

      // Gol kontrolü (sadece bir logo kale içindeyse)
      const goalX = centerX + Math.cos(goalAngle) * circleRadius;
      const goalY = centerY + Math.sin(goalAngle) * circleRadius;
      if (
        (logo1X > goalX - goalWidth / 2 && logo1X < goalX + goalWidth / 2 && logo1Y > goalY - goalHeight / 2 && logo1Y < goalY + goalHeight / 2) ||
        (logo2X > goalX - goalWidth / 2 && logo2X < goalX + goalWidth / 2 && logo2Y > goalY - goalHeight / 2 && logo2Y < goalY + goalHeight / 2)
      ) {
        score += 1;
        console.log("Goal!");
        resetGame(); // Maç baştan başlar
      }

      requestAnimationFrame(draw);
    };

    // İlk çizimi başlatmak için
    if (logo1Img.complete && logo1Img.naturalWidth > 0 && logo2Img.complete && logo2Img.naturalWidth > 0) {
      draw();
    }
  }, []);

  return (
    <div>
      <h1>Neon Watch Game</h1>
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} />
    </div>
  );
}