function send() {
  const input = document.getElementById('input');
  const text = input.value.trim();

  if (!text) return;

  const messages = document.getElementById('messages');
  messages.innerHTML += `<p>${text}</p>`;
  input.value = '';
}
