export default function ({ root }) {
  root.style.cssText += ';background:#141414;color:#fff;display:grid;place-items:center;font:80px system-ui';
  const title = document.createElement('div');
  title.textContent = 'MotionHarness';
  root.append(title);
  return {
    prepareFrame(time) {
      const progress = Math.min(1, time / 0.8);
      title.style.opacity = String(progress);
      title.style.transform = `translateY(${40 * (1 - progress) ** 3}px)`;
    },
    dispose() { title.remove(); },
  };
}
