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
}
