// 입력 처리 모듈
export function initInput() {
  const input = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');

  function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    console.log(text);
    input.value = '';
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);
}
