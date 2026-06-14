/**
 * Applies a premium text overlay on an image using Canvas API.
 * Dark gradient at bottom, white text, gold accent line.
 */
export async function applyTextOverlay(
  imageSrc: string,
  title: string,
  iscover = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const size = Math.max(img.width, img.height, 1080);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

      const gradientHeight = size * 0.45;
      const gradient = ctx.createLinearGradient(0, size - gradientHeight, 0, size);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)');
      gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, size - gradientHeight, size, gradientHeight);

      const goldColor = '#FFD700';
      const lineY = size - gradientHeight * 0.55;
      const lineWidth = size * 0.15;
      ctx.strokeStyle = goldColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo((size - lineWidth) / 2, lineY);
      ctx.lineTo((size + lineWidth) / 2, lineY);
      ctx.stroke();

      const maxTextWidth = size * 0.85;
      const textX = size / 2;
      const baseFontSize = iscover ? size * 0.055 : size * 0.045;

      const lines = wrapText(ctx, title, maxTextWidth, baseFontSize);
      const lineHeight = baseFontSize * 1.3;
      const totalTextHeight = lines.length * lineHeight;
      const textStartY = size - gradientHeight * 0.35 + (gradientHeight * 0.25 - totalTextHeight) / 2;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      lines.forEach((line, i) => {
        const y = textStartY + i * lineHeight;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 ${baseFontSize}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
        ctx.fillText(line, textX, y);
      });

      ctx.shadowColor = 'transparent';
      ctx.fillStyle = goldColor;
      const dotY = textStartY + totalTextHeight + baseFontSize * 0.5;
      ctx.beginPath();
      ctx.arc(textX, dotY, 3, 0, Math.PI * 2);
      ctx.fill();

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image for overlay'));
    img.src = imageSrc;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  ctx.font = `600 ${fontSize}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length > 3) {
    const truncated = lines.slice(0, 3);
    truncated[2] = truncated[2].replace(/\s+\S*$/, '...');
    return truncated;
  }

  return lines;
}
