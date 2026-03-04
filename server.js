const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("."));

const rooms = {}; // In-memory rooms

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

io.on("connection", (socket) => {
  let currentRoom = null;

  // CREATE ROOM
  socket.on("createRoom", (name, callback) => {
    const code = generateRoomCode();
    rooms[code] = { users: [{ id: socket.id, name }], messages: [] }; // creator counts as 1
    socket.join(code);
    currentRoom = code;
    callback(code);
  });

  // JOIN ROOM
  socket.on("joinRoom", ({ code, name }, callback) => {
    const room = rooms[code];
    if (!room) return callback({ success: false, message: "Not found!" });

    // Limit total users to 3 (including creator)
    if (room.users.length >= 3) return callback({ success: false, message: "Full!" });

    room.users.push({ id: socket.id, name });
    socket.join(code);
    currentRoom = code;
    callback({ success: true });

    // Send last 50 messages to new user
    const last50 = room.messages.slice(-50);
    socket.emit("loadMessages", last50);

    // Notify room
    io.to(code).emit("systemMessage", `${name} joined ${code}`);
  });

  // SEND MESSAGE
  socket.on("sendMessage", ({ code, name, message }) => {
    const room = rooms[code];
    if (!room) return;

    // Only hours and minutes for timestamp
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const msg = { name, message, time };
    room.messages.push(msg); // unlimited messages
    io.to(code).emit("newMessage", msg);
  });

  // DISCONNECT
  socket.on("disconnecting", () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].users = rooms[currentRoom].users.filter(u => u.id !== socket.id);
      if (rooms[currentRoom].users.length === 0) delete rooms[currentRoom];
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));