export function syncAccentFavicon(animate = true) {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const context = canvas.getContext('2d');
  let faviconFrame = 0;
  const faviconStart = performance.now();
  const updateFavicon = () => {
    if (!context) return;
    context.clearRect(0, 0, 32, 32);
    context.fillStyle = getComputedStyle(root).getPropertyValue('--accent').trim();
    context.beginPath();
    context.arc(16, 16, 14, 0, Math.PI * 2);
    context.fill();
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.type = 'image/png';
    icon.href = canvas.toDataURL('image/png');
    if (animate && performance.now() - faviconStart < 400) faviconFrame = requestAnimationFrame(updateFavicon);
  };
  updateFavicon();
  return () => cancelAnimationFrame(faviconFrame);
}
