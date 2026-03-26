// 입력 처리 모듈
export function initInput(onSend) {
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    input.style.transform = 'scale(0.96)';
    onSend(text);
    input.value = '';
    setTimeout(() => { input.style.transform = ''; }, 50);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  // 마우스 위치를 따라다니는 국소 glow
  let glowX = 0, glowY = 0;
  let targetX = 0, targetY = 0;
  let hovering = false;
  let opacity = 0;
  let rafId = null;

  function updateGlow() {
    glowX += (targetX - glowX) * 0.08;
    glowY += (targetY - glowY) * 0.08;

    const targetOpacity = hovering ? 1 : 0;
    opacity += (targetOpacity - opacity) * 0.04;

    const alpha = (0.06 * opacity).toFixed(4);
    input.style.background =
      `radial-gradient(circle 150px at ${glowX}px ${glowY}px, rgba(255,255,255,${alpha}), transparent 70%), #1a1a1a`;

    if (opacity > 0.001 || hovering) {
      rafId = requestAnimationFrame(updateGlow);
    } else {
      input.style.background = '#1a1a1a';
      rafId = null;
    }
  }

  input.addEventListener('mousemove', (e) => {
    const rect = input.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    hovering = true;
    if (!rafId) rafId = requestAnimationFrame(updateGlow);
  });

  input.addEventListener('mouseleave', () => {
    hovering = false;
  });
}
