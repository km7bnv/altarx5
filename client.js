const socket = io();

let roomCode = '';
let userName = '';

document.getElementById('createBtn').onclick = () => {
  const name = document.getElementById('name').value.trim();
  if (!name) return alert('Enter your name');
  userName = name;
  socket.emit('createRoom', name, (code) => {
    roomCode = code;
    showChat(code);
    document.getElementById('info').innerText = 'Room created: ' + code;
  });
};

document.getElementById('joinBtn').onclick = () => {
  const name = document.getElementById('name').value.trim();
  const code = document.getElementById('code').value.trim();
  if (!name || !code) return alert('Enter name and code');
  userName = name;
  socket.emit('joinRoom', { code, name }, (res) => {
    if (res.success) {
      roomCode = code;
      showChat(code);
    } else alert(res.message);
  });
};

document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('message').value.trim();
  if (!msg) return;
  socket.emit('sendMessage', { code: roomCode, name: userName, message: msg });
  document.getElementById('message').value = '';
};

socket.on('loadMessages', (messages) => {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  messages.forEach((msg) => addMessageToScreen(msg));
});

socket.on('newMessage', (msg) => addMessageToScreen(msg));

socket.on('systemMessage', (text) => {
  const chat = document.getElementById('chat');
  chat.innerHTML += `<i>${text}</i><br>`;
  chat.scrollTop = chat.scrollHeight;
});

function addMessageToScreen(msg) {
  const chat = document.getElementById('chat');
  chat.innerHTML += `<b>${msg.name}</b> [${msg.time}]: ${msg.message}<br>`;
  const lines = chat.innerHTML.split('<br>');
  if (lines.length > 50) chat.innerHTML = lines.slice(-50).join('<br>');
  chat.scrollTop = chat.scrollHeight;
}

function showChat(code) {
  document.getElementById('chatUI').style.display = 'block';
  document.getElementById('roomCodeDisplay').innerText = code;
}
