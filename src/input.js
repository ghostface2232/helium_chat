// 입력 처리 모듈
export function initInput(onSend) {
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const uiRoot = document.getElementById('ui-root');
  const isIosTouchDevice = (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
  let lastTouchEndAt = 0;

  function focusInputWithoutScroll() {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
  }

  // 초기 한 줄 높이를 실측 → 이 값의 절반을 항상 borderRadius로 사용
  const pillRadius = input.scrollHeight / 2;

  // textarea 높이 자동 조절
  function autoResize() {
    input.style.height = 'auto';
    const sh = input.scrollHeight;
    input.style.height = Math.min(sh, 200) + 'px';
    input.style.borderRadius = pillRadius + 'px';
  }

  input.addEventListener('input', autoResize);

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    input.style.transform = 'scale(0.96)';
    onSend(text);
    input.value = '';
    autoResize();
    setTimeout(() => { input.style.transform = ''; }, 50);
    // 전송 후 키보드 유지 (모바일)
    focusInputWithoutScroll();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  // iOS Safari가 최초 포커스 시 textarea를 보이게 하려고 viewport를 밀지 않도록 차단
  if (isIosTouchDevice) {
    input.addEventListener('touchstart', (e) => {
      if (document.activeElement === input) return;

      e.preventDefault();
      focusInputWithoutScroll();

      if (!input.value) {
        input.setSelectionRange(0, 0);
      }
    }, { passive: false });

    // Safari의 핀치 줌과 더블탭 확대를 차단해 입력 중 화면 스케일이 흔들리지 않게 유지
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    }, { passive: false });

    uiRoot.addEventListener('touchend', (e) => {
      if (e.target === input) return;

      const now = performance.now();
      if (now - lastTouchEndAt < 300) {
        e.preventDefault();
      }
      lastTouchEndAt = now;
    }, { passive: false });
  }

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
