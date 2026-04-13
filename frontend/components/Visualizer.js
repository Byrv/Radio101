'use client';
import { useRef, useEffect } from 'react';

export default function Visualizer({ analyserNode, isPlaying }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyserNode || !isPlaying || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Draw idle state
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw subtle idle bars
        const barCount = 40;
        const barWidth = (canvas.width / barCount) * 0.7;
        const gap = (canvas.width / barCount) * 0.3;
        for (let i = 0; i < barCount; i++) {
          const hue = (i / barCount) * 60 + 240;
          ctx.fillStyle = `hsla(${hue}, 60%, 40%, 0.15)`;
          const barHeight = 3 + Math.sin(i * 0.5) * 2;
          ctx.fillRect(i * (barWidth + gap), canvas.height - barHeight, barWidth, barHeight);
        }
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = Math.min(bufferLength, 64);
      const barWidth = (canvas.width / barCount) * 0.75;
      const gap = (canvas.width / barCount) * 0.25;
      let x = 0;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Gradient from indigo to magenta
        const hue = (i / barCount) * 60 + 240;
        const saturation = 75 + (dataArray[i] / 255) * 20;
        const lightness = 45 + (dataArray[i] / 255) * 25;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        // Rounded bars
        const radius = Math.min(barWidth / 2, 3);
        const bx = x;
        const by = canvas.height - barHeight;
        const bw = barWidth;
        const bh = Math.max(barHeight, 2);

        ctx.beginPath();
        ctx.moveTo(bx + radius, by);
        ctx.lineTo(bx + bw - radius, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + radius);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx, by + radius);
        ctx.quadraticCurveTo(bx, by, bx + radius, by);
        ctx.closePath();
        ctx.fill();

        x += barWidth + gap;
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="visualizer-container" id="visualizer">
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        className="visualizer-canvas"
      />
    </div>
  );
}
