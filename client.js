const socket = io();

let roomCode = '';
let userName = '';

// ---------------------------
// CREATE ROOM
document.getElementById('createBtn').onclick = () => {
  const name = document.getElementById('name').value.trim();
  if (!name) return alert("Please enter your name before creating a room.");
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

  if (!name) return alert("Please enter your name to join a room.");
  if (!code) return alert("Please enter a room code.");

  userName = name;

  socket.emit('joinRoom', { code, name }, (res) => {
    if (res.success) {
      roomCode = code;
      showChat(code);
    } else if (res.message === "Church full") {
      alert("This church already has 3 people. You cannot join.");
    } else if (res.message === "Church not found!") {
      alert("Room not found! Check the code and try again.");
    } else {
      alert(res.message);
    }
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

// ---------------------------
// ENTER KEY SUPPORT
document.getElementById('message').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('sendBtn').click();
  }
});

// ---------------------------
// LOAD PAST MESSAGES
socket.on('loadMessages', (messages) => {
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  messages.forEach(msg => addMessageToScreen(msg));
});

// ---------------------------
// NEW MESSAGE
socket.on('newMessage', (msg) => addMessageToScreen(msg));

// ---------------------------
// SYSTEM MESSAGE
socket.on('systemMessage', (text) => {
  const chat = document.getElementById('chat');
  const sysDiv = document.createElement('div');
  sysDiv.classList.add('system-message');
  sysDiv.textContent = text.trim();
  chat.appendChild(sysDiv);
  chat.scrollTop = chat.scrollHeight;
});

// ---------------------------
// ADD MESSAGE TO SCREEN
function addMessageToScreen(msg) {
  const chat = document.getElementById('chat');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');
  if (msg.name === userName) msgDiv.classList.add('self');

  const textSpan = document.createElement('span');
  textSpan.textContent = `${msg.name} [${msg.time}]: ${msg.message.trim()}`;
  msgDiv.appendChild(textSpan);

  chat.appendChild(msgDiv);

  // Keep only last 50 messages
  while (chat.children.length > 50) chat.removeChild(chat.firstChild);

  chat.scrollTop = chat.scrollHeight;
}

// ---------------------------
// SHOW CHAT SCREEN
function showChat(code) {
  document.getElementById('joinScreen').style.display = 'none';
  document.getElementById('chatScreen').style.display = 'flex';
  document.getElementById('roomCodeDisplay').innerText = code;
}