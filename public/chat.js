const input = document.getElementById('input');
const messages = document.getElementById('messages');

function addMessage(text) {
  const item = document.createElement('div');
  item.className = 'message';
  item.textContent = text;
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
}

function send() {
  const text = input.value.trim();

  if (!text) {
    return;
  }

  addMessage(text);
  input.value = '';
}

input.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    send();
  }
});
