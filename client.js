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

// Press Enter to send
document.getElementById('message').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('sendBtn').click();
  }
});

// Load past messages
socket.on('loadMessages', (messages) => {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  messages.forEach((msg) => addMessageToScreen(msg));
});

// New incoming messages
socket.on('newMessage', (msg) => addMessageToScreen(msg));

// System messages
socket.on('systemMessage', (text) => {
  const chat = document.getElementById('chat');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('system-message'); // uses your CSS
  msgDiv.textContent = text;

  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
});

// ---------------------------
// Function to add messages to the screen safely
function addMessageToScreen(msg) {
  const chat = document.getElementById('chat');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message'); // uses your CSS
  msgDiv.textContent = `${msg.name} [${msg.time}]: ${msg.message}`;

  chat.appendChild(msgDiv);

  // Keep only last 50 messages
  while (chat.children.length > 50) {
    chat.removeChild(chat.firstChild);
  }

  chat.scrollTop = chat.scrollHeight;
}

// Show chat UI
function showChat(code) {
  document.getElementById('chatUI').style.display = 'block';
  document.getElementById('roomCodeDisplay').innerText = code;
}
