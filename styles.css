const socket = io();

let roomCode = '';
let userName = '';

// ---------------------------
// CREATE ROOM
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

// ---------------------------
// JOIN ROOM
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

// ---------------------------
// SEND MESSAGE
document.getElementById('sendBtn').onclick = () => {
  const msg = document.getElementById('message').value.trim();
  if (!msg) return;

  socket.emit('sendMessage', { code: roomCode, name: userName, message: msg });
  document.getElementById('message').value = '';
};

// ENTER KEY SUPPORT
document.getElementById('message').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('sendBtn').click();
  }
});

// ---------------------------
// LOAD PAST MESSAGES
socket.on('loadMessages', (messages) => {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  messages.forEach((msg) => addMessageToScreen(msg));
});

// NEW MESSAGE
socket.on('newMessage', (msg) => addMessageToScreen(msg));

// SYSTEM MESSAGE
socket.on('systemMessage', (text) => {
  const chat = document.getElementById('chat');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('system-message'); // uses your CSS
  msgDiv.textContent = text;

  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
});

// ---------------------------
// FUNCTION TO ADD MESSAGES TO SCREEN
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

// ---------------------------
// SHOW CHAT SCREEN
function showChat(code) {
  document.getElementById('joinScreen').style.display = 'none';  // hide join/create inputs
  document.getElementById('chatScreen').style.display = 'block'; // show chat UI
  document.getElementById('roomCodeDisplay').innerText = code;
}